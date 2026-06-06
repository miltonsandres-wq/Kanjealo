// ═══════════════════════════════════════
// Kanjealo — Tipos TypeScript
// ═══════════════════════════════════════

export type LoyaltyModel = 'stamps' | 'cashback' | 'points' | 'tiers' | 'referrals' | 'mixed';

export interface Negocio {
  id: string;
  clerk_org_id: string;
  nombre: string;
  slug: string;
  logo_url: string | null;
  color_marca: string;
  nombre_programa: string;
  sellos_requeridos: number;
  descripcion_premio: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: "basic" | "pro";
  esta_activo: boolean;
  created_at: string;
  stamp_icon?: string;
  stamp_filled_color?: string;
  stamp_empty_color?: string;
}

export interface LoyaltyConfig {
  id: string;
  business_id: string;
  model: LoyaltyModel;
  cashback_percent: number;
  cashback_min_purchase: number;
  cashback_expiry_days: number;
  points_per_lempira: number;
  points_value: number;
  tiers_config: TierDef[];
  referral_reward_referrer: number;
  referral_reward_new: number;
  updated_at: string;
}

export interface TierDef {
  name: string;
  min_points: number;
  color: string;
  perks: string;
}

export interface Cliente {
  id: string;
  business_id: string;
  nombre: string;
  telefono: string | null;
  total_sellos: number;
  total_canjes: number;
  pass_serial: string | null;
  push_token: string | null;
  created_at: string;
  ultima_visita?: string;
}

export interface CashbackBalance {
  id: string;
  customer_id: string;
  business_id: string;
  balance: number;
  total_earned: number;
  total_redeemed: number;
  updated_at: string;
}

export interface CashbackTransaction {
  id: string;
  customer_id: string;
  business_id: string;
  type: 'earn' | 'redeem';
  amount: number;
  purchase_amount: number | null;
  created_at: string;
}

export interface PointsBalance {
  id: string;
  customer_id: string;
  business_id: string;
  balance: number;
  total_earned: number;
  total_redeemed: number;
  tier: string;
  updated_at: string;
}

export interface PointsTransaction {
  id: string;
  customer_id: string;
  business_id: string;
  type: 'earn' | 'redeem' | 'tier_bonus' | 'referral';
  points: number;
  description: string | null;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  business_id: string;
  status: 'pending' | 'completed' | 'rewarded';
  reward_given: boolean;
  created_at: string;
}

export interface Sello {
  id: string;
  customer_id: string;
  business_id: string;
  cashier_pin: string | null;
  created_at: string;
}

export interface Canje {
  id: string;
  customer_id: string;
  business_id: string;
  created_at: string;
}

export interface Cajero {
  id: string;
  business_id: string;
  nombre: string;
  pin_hash: string;
  esta_activo: boolean;
  created_at: string;
}

export interface EstadisticaCard {
  titulo: string;
  valor: string | number;
  icono: string;
  tendencia?: { valor: number; esPositivo: boolean };
}

export interface ActividadDiaria {
  fecha: string;
  sellos: number;
  canjes: number;
}
