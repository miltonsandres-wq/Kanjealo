import jwt from "jsonwebtoken";

const ISSUER_ID    = process.env.GOOGLE_WALLET_ISSUER_ID!;
const CLIENT_EMAIL = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL!;
const PRIVATE_KEY  = (process.env.GOOGLE_WALLET_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

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

export function generarUrlGoogleWallet(params: PassParams): { url: string; payload: object } {
  const { businessNombre, programaNombre, clientId, clienteNombre, totalSellos, sellosRequeridos, model } = params;

  const classId  = `${ISSUER_ID}.KANJEALO`;
  const objectId = `${ISSUER_ID}.${clientId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const labelPuntos = model === "cashback" ? "Cashback"
    : model === "points" || model === "tiers" ? "Puntos"
    : "Sellos";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanjealo.vercel.app";

  const loyaltyObject = {
    id: objectId,
    classId,
    state: "ACTIVE",
    accountId: clientId,
    accountName: clienteNombre,
    loyaltyPoints: {
      balance: { string: `${totalSellos}` },
      label: labelPuntos,
    },
    barcode: {
      type: "QR_CODE",
      value: `kj:id:${clientId}`,
      alternateText: clienteNombre,
    },
    textModulesData: [
      {
        header: "Negocio",
        body: businessNombre,
        id: "negocio",
      },
      {
        header: "Progreso",
        body: `${totalSellos} de ${sellosRequeridos} ${labelPuntos.toLowerCase()}`,
        id: "progreso",
      },
      ...(programaNombre && programaNombre !== businessNombre
        ? [{ header: "Programa", body: programaNombre, id: "programa" }]
        : []),
    ],
  };

  const jwtPayload = {
    iss: CLIENT_EMAIL,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [appUrl],
    payload: {
      loyaltyObjects: [loyaltyObject],
    },
  };

  const token = jwt.sign(jwtPayload, PRIVATE_KEY, { algorithm: "RS256" });
  return { url: `https://pay.google.com/gp/v/save/${token}`, payload: jwtPayload };
}
