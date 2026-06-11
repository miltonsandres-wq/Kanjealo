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

export interface PassParams {
  businessId: string;
  businessNombre: string;
  programaNombre: string;
  colorMarca: string;
  logoUrl?: string;
  clientId: string;
  clienteNombre: string;
  totalSellos: number;
  sellosRequeridos: number;
  model: string;
  descripcionPremio?: string;
  sucursales: Sucursal[];
  stampIcon?: string;
  stampFilledColor?: string;
  stampEmptyColor?: string;
  classHeroUrl?: string | null;
  heroImageUrl?: string | null;
}

function safeId(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/g, "_");
}

// Generic Pass: heroImage renders at the TOP of the card; barcode at the BOTTOM.
// Loyalty Card: barcode renders in the center; heroImage below barcode. Wrong layout.
function buildGenericObject(params: PassParams, classId: string, objectId: string, heroImageUrl?: string | null) {
  const { clientId, clienteNombre, totalSellos, sellosRequeridos, descripcionPremio } = params;

  const textModules: { header: string; body: string; id: string }[] = [];
  if (clienteNombre) {
    textModules.push({ header: "Miembro", body: clienteNombre, id: "miembro" });
  }
  if (descripcionPremio) {
    textModules.push({ header: "Premio", body: descripcionPremio, id: "premio" });
  }

  return {
    id: objectId,
    classId,
    state: "ACTIVE",
    cardTitle: {
      defaultValue: { language: "es", value: params.programaNombre || params.businessNombre },
    },
    header: {
      defaultValue: { language: "es", value: params.businessNombre },
    },
    subheader: {
      defaultValue: { language: "es", value: `SELLOS: ${totalSellos} / ${sellosRequeridos}` },
    },
    ...(heroImageUrl
      ? {
          heroImage: {
            sourceUri: { uri: heroImageUrl },
            contentDescription: {
              defaultValue: {
                language: "es",
                value: `${totalSellos} de ${sellosRequeridos} sellos`,
              },
            },
          },
        }
      : {}),
    barcode: {
      type: "QR_CODE",
      value: `kj:id:${clientId}`,
      alternateText: "Mostrar para sumar puntos",
    },
    ...(textModules.length > 0 ? { textModulesData: textModules } : {}),
  };
}

function buildGenericClass(params: PassParams, classId: string) {
  const color = params.colorMarca.startsWith("#") ? params.colorMarca : `#${params.colorMarca}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanjealo.vercel.app";
  const logoUri = params.logoUrl ?? `${appUrl}/logos/kanjealo-icon-1024.png`;

  return {
    id: classId,
    issuerName: params.businessNombre,
    reviewStatus: "UNDER_REVIEW",
    hexBackgroundColor: color,
    logo: {
      sourceUri: { uri: logoUri },
      contentDescription: {
        defaultValue: { language: "es", value: params.businessNombre },
      },
    },
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

async function upsertGenericClass(classId: string, params: PassParams): Promise<void> {
  const token = await getAuthToken();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const genericClass = buildGenericClass(params, classId);

  const getRes = await fetch(`${WALLET_API}/genericClass/${encodeURIComponent(classId)}`, { headers });

  if (getRes.status === 404) {
    const postRes = await fetch(`${WALLET_API}/genericClass`, {
      method: "POST",
      headers,
      body: JSON.stringify(genericClass),
    });
    if (!postRes.ok) {
      const err = await postRes.json();
      throw new Error(`Error creando clase: ${JSON.stringify(err)}`);
    }
  } else if (getRes.ok) {
    await fetch(`${WALLET_API}/genericClass/${encodeURIComponent(classId)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(genericClass),
    });
  } else {
    const err = await getRes.json();
    throw new Error(`Error consultando clase: ${JSON.stringify(err)}`);
  }
}

async function upsertGenericObject(genericObject: object, objectId: string): Promise<void> {
  const token = await getAuthToken();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const getRes = await fetch(`${WALLET_API}/genericObject/${encodeURIComponent(objectId)}`, { headers });

  if (getRes.status === 404) {
    const postRes = await fetch(`${WALLET_API}/genericObject`, {
      method: "POST",
      headers,
      body: JSON.stringify(genericObject),
    });
    if (!postRes.ok) {
      const err = await postRes.json();
      throw new Error(`Error creando objeto: ${JSON.stringify(err)}`);
    }
  } else if (getRes.ok) {
    const patchRes = await fetch(`${WALLET_API}/genericObject/${encodeURIComponent(objectId)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(genericObject),
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

export async function actualizarPaseGoogleWallet(params: PassParams): Promise<void> {
  const classId  = `${ISSUER_ID}.${safeId(params.businessId)}`;
  const objectId = `${ISSUER_ID}.${safeId(params.clientId)}`;

  const genericObject = buildGenericObject(params, classId, objectId, params.heroImageUrl);
  await upsertGenericObject(genericObject, objectId);
}

export async function generarUrlGoogleWallet(
  params: PassParams,
): Promise<{ url: string; payload: object; heroImageUrl: string | null }> {
  const classId  = `${ISSUER_ID}.${safeId(params.businessId)}`;
  const objectId = `${ISSUER_ID}.${safeId(params.clientId)}`;
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanjealo.vercel.app";

  const { heroImageUrl = null } = params;

  const genericClass  = buildGenericClass(params, classId);
  const genericObject = buildGenericObject(params, classId, objectId, heroImageUrl);

  // REST API calls are non-fatal (Issuer ID may be misconfigured in console)
  try {
    await upsertGenericClass(classId, params);
  } catch (e) {
    console.warn("[wallet] upsertGenericClass falló (no fatal):", e instanceof Error ? e.message : e);
  }
  try {
    await upsertGenericObject(genericObject, objectId);
  } catch (e) {
    console.warn("[wallet] upsertGenericObject falló (no fatal):", e instanceof Error ? e.message : e);
  }

  // JWT includes both class and object — Generic Pass requires the class to exist
  // before saving the object. Since REST API may fail, embed both in the JWT so
  // Google Wallet can create everything from the token alone.
  const jwtPayload = {
    iss: CLIENT_EMAIL,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [appUrl],
    payload: {
      genericClasses: [genericClass],
      genericObjects: [genericObject],
    },
  };

  const token = jwt.sign(jwtPayload, PRIVATE_KEY, { algorithm: "RS256" });
  return { url: `https://pay.google.com/gp/v/save/${token}`, payload: jwtPayload, heroImageUrl };
}
