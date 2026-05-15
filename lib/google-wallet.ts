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
  const classId  = `${ISSUER_ID}.${businessId.replace(/-/g, "")}`;
  const objectId = `${ISSUER_ID}.${clientId.replace(/-/g, "")}`;

  const color = colorMarca.startsWith("#") ? colorMarca : `#${colorMarca}`;

  const ubicaciones = sucursales
    .filter(s => s.latitud && s.longitud)
    .map(s => ({ kind: "walletobjects#latLongPoint", latitude: s.latitud, longitude: s.longitud }));

  const mensajeNotificacion = sucursales.find(s => s.mensaje_notificacion)?.mensaje_notificacion
    ?? "¡Estás cerca! Muestra tu tarjeta para ganar tu recompensa.";

  const labelPuntos = model === "cashback" ? "Cashback" : model === "points" || model === "tiers" ? "Puntos" : "Sellos";

  const loyaltyClass = {
    id: classId,
    issuerName: "Kanjealo",
    programName: programaNombre || businessNombre,
    hexBackgroundColor: color,
    rewardsTierPoints: `${sellosRequeridos}`,
    rewardsTier: "Preferente",
    ...(ubicaciones.length > 0 && { locations: ubicaciones }),
    localScheduledNotifications: ubicaciones.length > 0 ? [
      {
        mergeable: true,
        notifyAfterDays: 0,
        scheduledNotification: {
          description: { defaultValue: { language: "es", value: mensajeNotificacion } },
        },
      },
    ] : [],
    multipleDevicesAndHoldersAllowedStatus: "ONE_USER_ALL_DEVICES",
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
    infoModuleData: {
      showLastUpdateTime: true,
      labelValueRows: [
        {
          columns: [
            { label: "Programa", value: programaNombre || businessNombre },
            { label: "Negocio", value: businessNombre },
          ],
        },
        {
          columns: [
            { label: labelPuntos, value: `${totalSellos}` },
            { label: "Para premio", value: `${sellosRequeridos}` },
          ],
        },
      ],
    },
  };

  const jwtPayload = {
    iss: CLIENT_EMAIL,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: ["https://kanjealo.hn", "http://localhost:3000", "http://localhost:3001"],
    payload: {
      loyaltyClasses: [loyaltyClass],
      loyaltyObjects: [loyaltyObject],
    },
  };

  const token = jwt.sign(jwtPayload, PRIVATE_KEY, { algorithm: "RS256" });
  return `https://pay.google.com/gp/v/save/${token}`;
}
