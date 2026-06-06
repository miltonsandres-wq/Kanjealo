// Image generation moved to app/api/wallet/card-image/route.tsx (uses next/og ImageResponse)

export interface CardImageParams {
  nombrePrograma: string;
  nombreNegocio: string;
  colorMarca: string;
  logoUrl?: string | null;
  stampIcon?: string;
  stampFilledColor?: string;
  stampEmptyColor?: string;
  totalSellos?: number;
  sellosRequeridos?: number;
  descripcionPremio?: string;
  model?: string;
}
