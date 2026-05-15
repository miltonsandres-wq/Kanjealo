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
    businessId, businessNombre, programaNombre, colorMarca,
    clientId, clienteNombre, totalSellos, sellosRequeridos, model, sucursales,
  } = params;

  // IDs: solo alfanuméricos + puntos
  const classId  = `${ISSUER_ID}.${businessId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const objectId = `${ISSUER_ID}.${clientId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const color = colorMarca.startsWith("#") ? colorMarca : `#${colorMarca}`;

  const ubicaciones = sucursales
    .filter(s => s.latitud != null && s.longitud != null)
    .map(s => ({ latitude: s.latitud as number, longitude: s.longitud as number }));

  const labelPuntos = model === "cashback" ? "Cashback" : model === "points" || model === "tiers" ? "Puntos" : "Sellos";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanjealo.hn";

  const loyaltyClass = {
    id: classId,
    issuerName: businessNombre,
    programName: programaNombre || businessNombre,
    reviewStatus: "UNDER_REVIEW",
    hexBackgroundColor: color,
    multipleDevicesAndHoldersAllowedStatus: "ONE_USER_ALL_DEVICES",
    rewardsTiers: [
      {
        tier: "Preferente",
        tierPoints: `${sellosRequeridos}`,
      },
    ],
    ...(ubicaciones.length > 0 && { locations: ubicaciones }),
  };

  const loyaltyObject = {
    id: objectId,
    classId,
    state: "ACTIVE",
    accountId: clientId,
    accountName: clienteNombre,
    loyaltyPoints: {
      balance: { int: totalSellos },
      label: labelPuntos,
    },
    secondaryLoyaltyPoints: {
      balance: { int: sellosRequeridos },
      label: "Meta",
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
    ],
  };

  const jwtPayload = {
    iss: CLIENT_EMAIL,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [appUrl, "http://localhost:3000"],
    payload: {
      loyaltyClasses: [loyaltyClass],
      loyaltyObjects: [loyaltyObject],
    },
  };

  const token = jwt.sign(jwtPayload, PRIVATE_KEY, { algorithm: "RS256" });
  return `https://pay.google.com/gp/v/save/${token}`;
}
