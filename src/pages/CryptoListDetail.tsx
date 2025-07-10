import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Globe, Twitter, MessageCircle, Users, Calendar, Share, ExternalLink, Coins } from 'lucide-react';
import { format } from 'date-fns';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';

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

const CryptoListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listing, setListing] = useState<CryptoListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchListing(id);
    }
  }, [id]);

  const fetchListing = async (listingId: string) => {
    try {
      const { data, error } = await supabase
        .from('crypto_listings')
        .select('*')
        .eq('id', listingId)
        .eq('is_published', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Project not found",
            description: "The requested crypto project could not be found.",
            variant: "destructive",
          });
        }
        throw error;
      }
      
      setListing(data);
    } catch (error) {
      console.error('Error fetching listing:', error);
      navigate('/crypto-list');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.name,
          text: listing?.description || `Check out ${listing?.name} (${listing?.symbol})`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Project link copied to clipboard",
      });
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
      <Button variant="outline" asChild>
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
          <ExternalLink className="h-3 w-3" />
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
            <div className="text-muted-foreground">Loading project...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h3 className="text-2xl font-semibold text-foreground mb-3">Project Not Found</h3>
            <p className="text-muted-foreground mb-6">The requested crypto project could not be found.</p>
            <Button onClick={() => navigate('/crypto-list')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Crypto Listings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/crypto-list')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Crypto Listings
            </Button>
            
            <div className="flex items-start gap-4 mb-6">
              {listing.logo_url && (
                <img
                  src={listing.logo_url}
                  alt={`${listing.name} logo`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-foreground">
                    {listing.name}
                  </h1>
                  <Badge variant="secondary" className="text-sm">
                    {listing.symbol}
                  </Badge>
                </div>
                
                {listing.description && (
                  <p className="text-xl text-muted-foreground">
                    {listing.description}
                  </p>
                )}
              </div>
              
              <Button variant="outline" onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Token Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Token Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listing.ico_price && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">ICO Price</div>
                    <div className="text-lg font-semibold">{listing.ico_price}</div>
                  </div>
                )}
                
                {listing.circulating_supply && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Circulating Supply</div>
                    <div className="text-lg font-semibold">{listing.circulating_supply}</div>
                  </div>
                )}
                
                {listing.total_supply && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Supply</div>
                    <div className="text-lg font-semibold">{listing.total_supply}</div>
                  </div>
                )}
                
                {listing.listing_date && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Listing Date</div>
                    <div className="text-lg font-semibold">
                      {format(new Date(listing.listing_date), 'MMMM dd, yyyy')}
                    </div>
                  </div>
                )}
              </div>

              {listing.listing_exchange && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Listed on <span className="font-medium text-foreground">{listing.listing_exchange}</span>
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Official Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              
              {!listing.website_url && !listing.twitter_url && !listing.telegram_url && !listing.discord_url && (
                <div className="text-center py-8 text-muted-foreground">
                  No social links available for this project yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Listed on {format(new Date(listing.created_at), 'MMMM dd, yyyy')}
              </div>
              <Button variant="outline" onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" />
                Share Project
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoListDetail;