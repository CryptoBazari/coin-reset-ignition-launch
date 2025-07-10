import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ExternalLink, Calendar } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { format } from 'date-fns';

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
  is_published: boolean;
  created_at: string;
}

const CryptoListingsManagement = () => {
  const [listings, setListings] = useState<CryptoListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState<CryptoListing | null>(null);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    logo_url: '',
    description: '',
    website_url: '',
    twitter_url: '',
    telegram_url: '',
    discord_url: '',
    ico_price: '',
    circulating_supply: '',
    total_supply: '',
    listing_date: '',
    listing_exchange: '',
    is_published: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: "Error",
        description: "Failed to load crypto listings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      symbol: '',
      name: '',
      logo_url: '',
      description: '',
      website_url: '',
      twitter_url: '',
      telegram_url: '',
      discord_url: '',
      ico_price: '',
      circulating_supply: '',
      total_supply: '',
      listing_date: '',
      listing_exchange: '',
      is_published: false,
    });
    setEditingListing(null);
    setShowForm(false);
  };

  const handleEdit = (listing: CryptoListing) => {
    setFormData({
      symbol: listing.symbol,
      name: listing.name,
      logo_url: listing.logo_url || '',
      description: listing.description || '',
      website_url: listing.website_url || '',
      twitter_url: listing.twitter_url || '',
      telegram_url: listing.telegram_url || '',
      discord_url: listing.discord_url || '',
      ico_price: listing.ico_price || '',
      circulating_supply: listing.circulating_supply || '',
      total_supply: listing.total_supply || '',
      listing_date: listing.listing_date ? listing.listing_date.split('T')[0] : '',
      listing_exchange: listing.listing_exchange || '',
      is_published: listing.is_published,
    });
    setEditingListing(listing);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const listingData = {
        symbol: formData.symbol.toUpperCase(),
        name: formData.name,
        logo_url: formData.logo_url || null,
        description: formData.description || null,
        website_url: formData.website_url || null,
        twitter_url: formData.twitter_url || null,
        telegram_url: formData.telegram_url || null,
        discord_url: formData.discord_url || null,
        ico_price: formData.ico_price || null,
        circulating_supply: formData.circulating_supply || null,
        total_supply: formData.total_supply || null,
        listing_date: formData.listing_date ? new Date(formData.listing_date).toISOString() : null,
        listing_exchange: formData.listing_exchange || null,
        is_published: formData.is_published,
      };

      if (editingListing) {
        const { error } = await supabase
          .from('crypto_listings')
          .update(listingData)
          .eq('id', editingListing.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Crypto listing updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('crypto_listings')
          .insert([listingData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Crypto listing created successfully",
        });
      }

      resetForm();
      fetchListings();
    } catch (error) {
      console.error('Error saving listing:', error);
      toast({
        title: "Error",
        description: "Failed to save crypto listing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this crypto listing?')) return;

    try {
      const { error } = await supabase
        .from('crypto_listings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Crypto listing deleted successfully",
      });
      fetchListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast({
        title: "Error",
        description: "Failed to delete crypto listing",
        variant: "destructive",
      });
    }
  };

  if (loading && !showForm) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading crypto listings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Crypto Listings Management</h1>
            <p className="text-muted-foreground">Create and manage cryptocurrency listings</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Listing
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingListing ? 'Edit Crypto Listing' : 'Create New Crypto Listing'}</CardTitle>
              <CardDescription>
                Fill in the details below to {editingListing ? 'update' : 'create'} a crypto listing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input
                      id="symbol"
                      value={formData.symbol}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                      placeholder="BTC"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Bitcoin"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the cryptocurrency project"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input
                      id="website_url"
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter_url">Twitter URL</Label>
                    <Input
                      id="twitter_url"
                      value={formData.twitter_url}
                      onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                      placeholder="https://twitter.com/example"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telegram_url">Telegram URL</Label>
                    <Input
                      id="telegram_url"
                      value={formData.telegram_url}
                      onChange={(e) => setFormData({ ...formData, telegram_url: e.target.value })}
                      placeholder="https://t.me/example"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discord_url">Discord URL</Label>
                    <Input
                      id="discord_url"
                      value={formData.discord_url}
                      onChange={(e) => setFormData({ ...formData, discord_url: e.target.value })}
                      placeholder="https://discord.gg/example"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ico_price">ICO Price</Label>
                    <Input
                      id="ico_price"
                      value={formData.ico_price}
                      onChange={(e) => setFormData({ ...formData, ico_price: e.target.value })}
                      placeholder="$0.10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="circulating_supply">Circulating Supply</Label>
                    <Input
                      id="circulating_supply"
                      value={formData.circulating_supply}
                      onChange={(e) => setFormData({ ...formData, circulating_supply: e.target.value })}
                      placeholder="21,000,000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_supply">Total Supply</Label>
                    <Input
                      id="total_supply"
                      value={formData.total_supply}
                      onChange={(e) => setFormData({ ...formData, total_supply: e.target.value })}
                      placeholder="21,000,000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="listing_date">Listing Date</Label>
                    <Input
                      id="listing_date"
                      type="date"
                      value={formData.listing_date}
                      onChange={(e) => setFormData({ ...formData, listing_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="listing_exchange">Listing Exchange</Label>
                    <Input
                      id="listing_exchange"
                      value={formData.listing_exchange}
                      onChange={(e) => setFormData({ ...formData, listing_exchange: e.target.value })}
                      placeholder="Binance"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="publish"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label htmlFor="publish">Publish immediately</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editingListing ? 'Update Listing' : 'Create Listing'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {listing.logo_url && (
                      <img
                        src={listing.logo_url}
                        alt={`${listing.name} logo`}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {listing.name} ({listing.symbol})
                        {listing.is_published ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Published
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                            Draft
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span>{format(new Date(listing.created_at), 'MMM dd, yyyy')}</span>
                        {listing.listing_date && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Lists {format(new Date(listing.listing_date), 'MMM dd, yyyy')}
                            </span>
                          </>
                        )}
                        {listing.listing_exchange && (
                          <>
                            <span>•</span>
                            <span>on {listing.listing_exchange}</span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {listing.website_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={listing.website_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleEdit(listing)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(listing.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {listing.description && (
                <CardContent>
                  <p className="text-muted-foreground mb-2">{listing.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    {listing.ico_price && <div>ICO: {listing.ico_price}</div>}
                    {listing.circulating_supply && <div>Circulating: {listing.circulating_supply}</div>}
                    {listing.total_supply && <div>Total: {listing.total_supply}</div>}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CryptoListingsManagement;