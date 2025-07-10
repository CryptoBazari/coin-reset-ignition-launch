import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Globe, Twitter, MessageCircle, Users, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import Navbar from '@/components/Navbar';

interface CryptoListing {
  id: string;
  symbol: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  twitter_url: string | null;
  telegram_url: string | null;
  discord_url: string | null;
  ico_price: string | null;
  circulating_supply: string | null;
  total_supply: string | null;
  listing_date: string | null;
  listing_exchange: string | null;
  created_at: string;
}

const CryptoList = () => {
  const [listings, setListings] = useState<CryptoListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_listings')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching crypto listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const SocialLink = ({ 
    url, 
    icon: Icon, 
    label 
  }: { 
    url: string | null; 
    icon: React.ElementType; 
    label: string;
  }) => {
    if (!url) return null;
    
    return (
      <Button variant="outline" size="sm" asChild>
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
          <Icon className="h-4 w-4" />
          {label}
        </a>
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading crypto listings...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Crypto Listings</h1>
          <p className="text-muted-foreground text-lg">
            Discover upcoming and recently listed cryptocurrency projects
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              No crypto listings yet
            </h3>
            <p className="text-muted-foreground">
              We're working on curating the best upcoming crypto projects. Stay tuned!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    {listing.logo_url && (
                      <img
                        src={listing.logo_url}
                        alt={`${listing.name} logo`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {listing.name}
                        <Badge variant="secondary" className="text-xs">
                          {listing.symbol}
                        </Badge>
                      </CardTitle>
                      {listing.description && (
                        <CardDescription className="mt-2 line-clamp-3">
                          {listing.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Token Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {listing.ico_price && (
                      <div>
                        <span className="text-muted-foreground">ICO Price:</span>
                        <div className="font-medium">{listing.ico_price}</div>
                      </div>
                    )}
                    {listing.circulating_supply && (
                      <div>
                        <span className="text-muted-foreground">Circulating:</span>
                        <div className="font-medium">{listing.circulating_supply}</div>
                      </div>
                    )}
                    {listing.total_supply && (
                      <div>
                        <span className="text-muted-foreground">Total Supply:</span>
                        <div className="font-medium">{listing.total_supply}</div>
                      </div>
                    )}
                    {listing.listing_date && (
                      <div>
                        <span className="text-muted-foreground">Listing Date:</span>
                        <div className="font-medium">
                          {format(new Date(listing.listing_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    )}
                  </div>

                  {listing.listing_exchange && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Listing on <span className="font-medium">{listing.listing_exchange}</span>
                      </span>
                    </div>
                  )}

                  {/* Social Links */}
                  <div className="flex flex-wrap gap-2">
                    <SocialLink 
                      url={listing.website_url} 
                      icon={Globe} 
                      label="Website" 
                    />
                    <SocialLink 
                      url={listing.twitter_url} 
                      icon={Twitter} 
                      label="Twitter" 
                    />
                    <SocialLink 
                      url={listing.telegram_url} 
                      icon={MessageCircle} 
                      label="Telegram" 
                    />
                    <SocialLink 
                      url={listing.discord_url} 
                      icon={Users} 
                      label="Discord" 
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoList;