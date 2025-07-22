
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

interface PriceHistoryCardProps {
  priceHistory: Array<{ date: string; price: number }>;
}

export const PriceHistoryCard: React.FC<PriceHistoryCardProps> = ({ priceHistory }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const calculateChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(2);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            Price History (36 Months)
            <Tooltip content="Monthly closing prices for the last 36 months">
              <Info className="h-4 w-4 text-muted-foreground" />
            </Tooltip>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceHistory.map((entry, index) => (
                <TableRow key={entry.date}>
                  <TableCell>{formatDate(entry.date)}</TableCell>
                  <TableCell>{formatPrice(entry.price)}</TableCell>
                  <TableCell>
                    {index < priceHistory.length - 1 && (
                      <span className={Number(calculateChange(entry.price, priceHistory[index + 1].price)) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                      }>
                        {Number(calculateChange(entry.price, priceHistory[index + 1].price)) >= 0 ? '+' : ''}
                        {calculateChange(entry.price, priceHistory[index + 1].price)}%
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
