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

export function generarUrlGoogleWallet(params: PassParams): string {
  const {
    businessNombre, programaNombre, colorMarca,
    clientId, clienteNombre, totalSellos, sellosRequeridos, model, sucursales,
  } = params;

  // Clase compartida pre-creada en Google Wallet Console
  const classId  = `${ISSUER_ID}.KANJEALO`;
  const objectId = `${ISSUER_ID}.${clientId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const color = colorMarca.startsWith("#") ? colorMarca : `#${colorMarca}`;

  const ubicaciones = sucursales
    .filter(s => s.latitud != null && s.longitud != null)
    .map(s => ({ latitude: s.latitud as number, longitude: s.longitud as number }));

  const labelPuntos = model === "cashback" ? "Cashback"
    : model === "points" || model === "tiers" ? "Puntos"
    : "Sellos";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanjealo.vercel.app";

  const loyaltyObject = {
    id: objectId,
    classId,
    state: "active",
    accountId: clientId,
    accountName: clienteNombre,
    loyaltyPoints: {
      balance: { string: `${totalSellos}` },
      label: labelPuntos,
    },
    secondaryLoyaltyPoints: {
      balance: { string: `${sellosRequeridos}` },
      label: "Meta",
    },
    barcode: {
      type: "qrCode",
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
        header: programaNombre || businessNombre,
        body: `${totalSellos} de ${sellosRequeridos} ${labelPuntos.toLowerCase()}`,
        id: "progreso",
      },
    ],
    infoModuleData: {
      showLastUpdateTime: "true",
      labelValueRows: [
        {
          columns: [
            { label: "Programa", value: programaNombre || businessNombre },
            { label: "Negocio",  value: businessNombre },
          ],
        },
        {
          columns: [
            { label: labelPuntos,   value: `${totalSellos}` },
            { label: "Para premio", value: `${sellosRequeridos}` },
          ],
        },
      ],
    },
    hexBackgroundColor: color,
    ...(ubicaciones.length > 0 && { locations: ubicaciones }),
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
  return `https://pay.google.com/gp/v/save/${token}`;
}
