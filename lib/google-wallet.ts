import jwt from "jsonwebtoken";
import { GoogleAuth } from "google-auth-library";

const ISSUER_ID    = process.env.GOOGLE_WALLET_ISSUER_ID!;
const CLIENT_EMAIL = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL!;
const PRIVATE_KEY  = (process.env.GOOGLE_WALLET_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

const WALLET_API = "https://walletobjects.googleapis.com/walletobjects/v1";

interface Sucursal {
  latitud: number | null;
  longitud: number | null;
  mensaje_notificacion: string | null;
}

interface PassParams {
  businessId: string;
  businessNombre: string;
  programaNombre: string;
  colorMarca: string;
  clientId: string;
  clienteNombre: string;
  totalSellos: number;
  sellosRequeridos: number;
  model: string;
  sucursales: Sucursal[];
}

function buildStampRow(filled: number, total: number): string {
  const rows: string[] = [];
  const perRow = 5;
  for (let i = 0; i < total; i += perRow) {
    const row: string[] = [];
    for (let j = i; j < Math.min(i + perRow, total); j++) {
      row.push(j < filled ? "★" : "☆");
    }
    rows.push(row.join("  "));
  }
  return rows.join("\n");
}

function buildLoyaltyObject(params: PassParams, classId: string, objectId: string) {
  const { businessNombre, programaNombre, clientId, clienteNombre, totalSellos, sellosRequeridos, model } = params;

  const labelPuntos = model === "cashback" ? "Cashback"
    : model === "points" || model === "tiers" ? "Puntos"
    : "Sellos";

  const stampVisual = buildStampRow(totalSellos, sellosRequeridos);

  return {
    id: objectId,
    classId,
    state: "ACTIVE",
    accountId: clientId,
    accountName: clienteNombre,
    loyaltyPoints: {
      balance: { string: `${totalSellos} / ${sellosRequeridos}` },
      label: labelPuntos,
    },
    barcode: {
      type: "QR_CODE",
      value: `kj:id:${clientId}`,
      alternateText: clienteNombre,
    },
    textModulesData: [
      { header: "Negocio", body: businessNombre, id: "negocio" },
      { header: "Mis sellos", body: stampVisual, id: "sellos" },
      ...(programaNombre && programaNombre !== businessNombre
        ? [{ header: "Programa", body: programaNombre, id: "programa" }]
        : []),
    ],
  };
}

async function getAuthToken(): Promise<string> {
  const auth = new GoogleAuth({
    credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  });
  const client = await auth.getClient();
  const tokenRes = await client.getAccessToken();
  return tokenRes.token!;
}

async function upsertLoyaltyClass(classId: string, params: PassParams): Promise<void> {
  const token = await getAuthToken();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const color = params.colorMarca.startsWith("#") ? params.colorMarca : `#${params.colorMarca}`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanjealo.vercel.app";

  const loyaltyClass = {
    id: classId,
    issuerName: "Kanjealo",
    programName: params.programaNombre || params.businessNombre,
    hexBackgroundColor: color,
    reviewStatus: "UNDER_REVIEW",
    programLogo: {
      sourceUri: { uri: `${appUrl}/logos/kanjealo-icon-1024.png` },
      contentDescription: { defaultValue: { language: "es", value: "Kanjealo" } },
    },
  };

  const getRes = await fetch(`${WALLET_API}/loyaltyClass/${encodeURIComponent(classId)}`, { headers });

  if (getRes.status === 404) {
    const postRes = await fetch(`${WALLET_API}/loyaltyClass`, {
      method: "POST",
      headers,
      body: JSON.stringify(loyaltyClass),
    });
    if (!postRes.ok) {
      const err = await postRes.json();
      throw new Error(`Error creando clase: ${JSON.stringify(err)}`);
    }
  } else if (getRes.ok) {
    await fetch(`${WALLET_API}/loyaltyClass/${encodeURIComponent(classId)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(loyaltyClass),
    });
  }
}

async function upsertLoyaltyObject(loyaltyObject: object, objectId: string): Promise<void> {
  const token = await getAuthToken();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const getRes = await fetch(`${WALLET_API}/loyaltyObject/${encodeURIComponent(objectId)}`, { headers });

  if (getRes.status === 404) {
    const postRes = await fetch(`${WALLET_API}/loyaltyObject`, {
      method: "POST",
      headers,
      body: JSON.stringify(loyaltyObject),
    });
    if (!postRes.ok) {
      const err = await postRes.json();
      throw new Error(`Error creando objeto: ${JSON.stringify(err)}`);
    }
  } else if (getRes.ok) {
    const patchRes = await fetch(`${WALLET_API}/loyaltyObject/${encodeURIComponent(objectId)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(loyaltyObject),
    });
    if (!patchRes.ok) {
      const err = await patchRes.json();
      throw new Error(`Error actualizando objeto: ${JSON.stringify(err)}`);
    }
  } else {
    const err = await getRes.json();
    throw new Error(`Error consultando objeto: ${JSON.stringify(err)}`);
  }
}

export async function generarUrlGoogleWallet(params: PassParams): Promise<{ url: string; payload: object }> {
  const classId  = `${ISSUER_ID}.KANJEALO`;
  const objectId = `${ISSUER_ID}.${params.clientId.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanjealo.vercel.app";
  const loyaltyObject = buildLoyaltyObject(params, classId, objectId);

  // Pre-crear/actualizar clase y objeto via REST API
  await upsertLoyaltyClass(classId, params);
  await upsertLoyaltyObject(loyaltyObject, objectId);

  const jwtPayload = {
    iss: CLIENT_EMAIL,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [appUrl],
    payload: {
      loyaltyObjects: [{ id: objectId, classId }],
    },
  };

  const token = jwt.sign(jwtPayload, PRIVATE_KEY, { algorithm: "RS256" });
  return { url: `https://pay.google.com/gp/v/save/${token}`, payload: jwtPayload };
}
