"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Search,
  Package,
  CreditCard,
  Truck,
  Star,
  ExternalLink,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  priceUsd: number;
  image: string;
  rating: number;
  category: string;
  available: boolean;
}

export default function CommercePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Product[]>([]);

  // Mock products - in production would come from Reap API
  const products: Product[] = [
    {
      id: "1",
      name: "Hardware Wallet Pro",
      description: "Secure your crypto with this premium hardware wallet",
      price: "0.045 AVAX",
      priceUsd: 149.99,
      image: "🔐",
      rating: 4.8,
      category: "Hardware",
      available: true,
    },
    {
      id: "2", 
      name: "Developer Subscription",
      description: "1-month premium access to blockchain development tools",
      price: "0.015 AVAX",
      priceUsd: 49.99,
      image: "💻",
      rating: 4.9,
      category: "Software",
      available: true,
    },
    {
      id: "3",
      name: "Crypto Merch T-Shirt",
      description: "Show your love for Web3 with this premium cotton tee",
      price: "0.009 AVAX",
      priceUsd: 29.99,
      image: "👕",
      rating: 4.5,
      category: "Apparel",
      available: true,
    },
    {
      id: "4",
      name: "Conference Ticket",
      description: "Early bird access to the Avalanche Summit 2025",
      price: "0.15 AVAX",
      priceUsd: 499.00,
      image: "🎫",
      rating: 5.0,
      category: "Events",
      available: true,
    },
    {
      id: "5",
      name: "Cloud Computing Credits",
      description: "$100 worth of cloud computing for your dApps",
      price: "0.03 AVAX",
      priceUsd: 100.00,
      image: "☁️",
      rating: 4.7,
      category: "Services",
      available: true,
    },
    {
      id: "6",
      name: "NFT Art Print",
      description: "High-quality physical print of trending NFT artwork",
      price: "0.024 AVAX",
      priceUsd: 79.99,
      image: "🖼️",
      rating: 4.6,
      category: "Art",
      available: false,
    },
  ];

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.priceUsd, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commerce</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Purchase real-world goods and services with crypto via Reap
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Cart ({cart.length})
            {cart.length > 0 && (
              <Badge variant="secondary">${cartTotal.toFixed(2)}</Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Features */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <CreditCard className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="font-medium">Pay with Crypto</p>
              <p className="text-sm text-zinc-500">AVAX, USDC, and more</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <Truck className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Global Shipping</p>
              <p className="text-sm text-zinc-500">Delivered worldwide</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-kite-500/10 p-3">
              <Package className="h-6 w-6 text-kite-500" />
            </div>
            <div>
              <p className="font-medium">Powered by Reap</p>
              <p className="text-sm text-zinc-500">Secure checkout</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card key={product.id} className={!product.available ? "opacity-60" : ""}>
            <CardContent className="p-6">
              <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-zinc-100 text-5xl dark:bg-zinc-800">
                {product.image}
              </div>
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {product.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {product.rating}
                </div>
              </div>
              <p className="mb-4 text-sm text-zinc-500 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-avalanche-500">{product.price}</p>
                  <p className="text-xs text-zinc-500">${product.priceUsd.toFixed(2)}</p>
                </div>
                <Button
                  size="sm"
                  variant={product.available ? "default" : "outline"}
                  disabled={!product.available}
                  onClick={() => addToCart(product)}
                >
                  {product.available ? "Add to Cart" : "Sold Out"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-zinc-300" />
            <h3 className="mt-4 text-lg font-semibold">No products found</h3>
            <p className="text-zinc-500">Try adjusting your search</p>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            About Reap Commerce
          </CardTitle>
          <CardDescription>
            Real-world purchases powered by blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Reap enables you to purchase physical goods and services using cryptocurrency.
            Your agents can autonomously shop for items within their spending limits,
            making real-world commerce seamless and programmable. All transactions are
            settled on-chain with full transparency.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
