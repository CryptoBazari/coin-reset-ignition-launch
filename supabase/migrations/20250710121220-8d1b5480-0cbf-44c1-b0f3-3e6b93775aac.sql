-- Create enums for the system
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'pending', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'confirmed', 'failed', 'expired');
CREATE TYPE public.crypto_network AS ENUM ('bitcoin', 'ethereum', 'arbitrum');
CREATE TYPE public.crypto_token AS ENUM ('btc', 'usdt');
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- Create payment addresses table
CREATE TABLE public.payment_addresses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    network crypto_network NOT NULL,
    token crypto_token NOT NULL,
    address TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(network, token)
);

-- Create subscription plans table
CREATE TABLE public.subscription_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    duration_months INTEGER NOT NULL,
    price_btc NUMERIC(18, 8),
    price_usdt NUMERIC(18, 2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status subscription_status NOT NULL DEFAULT 'pending',
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crypto payments table
CREATE TABLE public.crypto_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    payment_address_id UUID NOT NULL REFERENCES public.payment_addresses(id),
    transaction_hash TEXT,
    amount NUMERIC(18, 8) NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news table
CREATE TABLE public.news (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    cover_image_url TEXT,
    author TEXT NOT NULL,
    tags TEXT[],
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create learning courses table
CREATE TABLE public.learning_courses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    cover_image_url TEXT,
    author TEXT NOT NULL,
    difficulty_level TEXT,
    estimated_duration INTEGER, -- in minutes
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crypto listings table
CREATE TABLE public.crypto_listings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    website_url TEXT,
    twitter_url TEXT,
    telegram_url TEXT,
    discord_url TEXT,
    ico_price TEXT,
    circulating_supply TEXT,
    total_supply TEXT,
    listing_date TIMESTAMP WITH TIME ZONE,
    listing_exchange TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin users table
CREATE TABLE public.admin_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'admin',
    permissions TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payment_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Payment addresses - public read access
CREATE POLICY "Anyone can view active payment addresses"
ON public.payment_addresses
FOR SELECT
USING (is_active = true);

-- Subscription plans - public read access
CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

-- User subscriptions - users can only see their own
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
ON public.user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Crypto payments - users can only see their own
CREATE POLICY "Users can view their own payments"
ON public.crypto_payments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
ON public.crypto_payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- News - public read access for published articles
CREATE POLICY "Anyone can view published news"
ON public.news
FOR SELECT
USING (is_published = true);

-- Learning courses - public read access for published courses
CREATE POLICY "Anyone can view published courses"
ON public.learning_courses
FOR SELECT
USING (is_published = true);

-- Crypto listings - public read access for published listings
CREATE POLICY "Anyone can view published crypto listings"
ON public.crypto_listings
FOR SELECT
USING (is_published = true);

-- Admin users - only admins can manage
CREATE POLICY "Admins can manage admin users"
ON public.admin_users
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid() AND is_active = true
    )
);

-- Create helper functions
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = user_uuid AND is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_subscriptions
        WHERE user_id = user_uuid 
        AND status = 'active'
        AND expires_at > now()
    );
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_payment_addresses_updated_at
    BEFORE UPDATE ON public.payment_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crypto_payments_updated_at
    BEFORE UPDATE ON public.crypto_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_news_updated_at
    BEFORE UPDATE ON public.news
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_courses_updated_at
    BEFORE UPDATE ON public.learning_courses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crypto_listings_updated_at
    BEFORE UPDATE ON public.crypto_listings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert payment addresses
INSERT INTO public.payment_addresses (network, token, address) VALUES
('arbitrum', 'usdt', '0xaeb2746fe0E7A5b815CB246e06e3D165f1936808'),
('bitcoin', 'btc', 'bc1qnkupdkd5270gp4e9qy23yn7xdv3eyr6zkvfml2'),
('ethereum', 'usdt', '0xaeb2746fe0E7A5b815CB246e06e3D165f1936808');

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, duration_months, price_btc, price_usdt) VALUES
('Monthly Pro', 'Access to all premium features including analyzer and virtual portfolio', 1, 0.00023000, 25.00),
('Yearly Pro', 'Access to all premium features for a full year with 20% discount', 12, 0.00220000, 240.00);