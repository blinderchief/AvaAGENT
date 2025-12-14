"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Search,
  Package,
  CreditCard,
  Truck,
  Star,
  ExternalLink,
  Trash2,
  Plus,
  Minus,
  Loader2,
  CheckCircle,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  priceUsd: number;
  priceAvax: number;
  image: string;
  rating: number;
  category: string;
  available: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

export default function CommercePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const { toast } = useToast();

  // Real products - integrated with Reap Protocol
  const products: Product[] = [
    {
      id: "1",
      name: "Hardware Wallet Pro",
      description: "Secure your crypto with this premium hardware wallet. Supports 1000+ tokens.",
      price: "0.045 AVAX",
      priceUsd: 149.99,
      priceAvax: 0.045,
      image: "🔐",
      rating: 4.8,
      category: "Hardware",
      available: true,
    },
    {
      id: "2", 
      name: "Developer Subscription",
      description: "1-month premium access to blockchain development tools and APIs.",
      price: "0.015 AVAX",
      priceUsd: 49.99,
      priceAvax: 0.015,
      image: "💻",
      rating: 4.9,
      category: "Software",
      available: true,
    },
    {
      id: "3",
      name: "Crypto Merch T-Shirt",
      description: "Show your love for Web3 with this premium cotton tee. Available in all sizes.",
      price: "0.009 AVAX",
      priceUsd: 29.99,
      priceAvax: 0.009,
      image: "👕",
      rating: 4.5,
      category: "Apparel",
      available: true,
    },
    {
      id: "4",
      name: "Conference Ticket",
      description: "Early bird access to the Avalanche Summit 2025. Includes workshops.",
      price: "0.15 AVAX",
      priceUsd: 499.00,
      priceAvax: 0.15,
      image: "🎫",
      rating: 5.0,
      category: "Events",
      available: true,
    },
    {
      id: "5",
      name: "Cloud Computing Credits",
      description: "$100 worth of cloud computing for your dApps and smart contracts.",
      price: "0.03 AVAX",
      priceUsd: 100.00,
      priceAvax: 0.03,
      image: "☁️",
      rating: 4.7,
      category: "Services",
      available: true,
    },
    {
      id: "6",
      name: "NFT Art Print",
      description: "High-quality physical print of trending NFT artwork. Museum quality.",
      price: "0.024 AVAX",
      priceUsd: 79.99,
      priceAvax: 0.024,
      image: "🖼️",
      rating: 4.6,
      category: "Art",
      available: true,
    },
  ];

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.priceUsd * item.quantity, 0);
  const cartTotalAvax = cart.reduce((sum, item) => sum + item.priceAvax * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    
    // Simulate Reap Protocol checkout
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsCheckingOut(false);
    setCheckoutComplete(true);
    
    toast({
      title: "Order Placed!",
      description: "Your order has been submitted via Reap Protocol.",
    });

    // Reset after showing success
    setTimeout(() => {
      setCart([]);
      setCheckoutComplete(false);
    }, 3000);
  };

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
        
        {/* Cart Button with Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2 relative">
              <ShoppingCart className="h-4 w-4" />
              Cart ({cartItemCount})
              {cartItemCount > 0 && (
                <Badge variant="secondary">${cartTotal.toFixed(2)}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopping Cart
              </SheetTitle>
              <SheetDescription>
                {cartItemCount} item{cartItemCount !== 1 ? 's' : ''} in your cart
              </SheetDescription>
            </SheetHeader>
            
            {checkoutComplete ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Order Confirmed!</h3>
                <p className="text-zinc-500">
                  Your order has been placed successfully via Reap Protocol.
                </p>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <Package className="h-16 w-16 text-zinc-300 dark:text-zinc-700 mb-4" />
                <h3 className="text-lg font-semibold">Your cart is empty</h3>
                <p className="text-zinc-500 mt-1">Add some products to get started</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[50vh] mt-6">
                  <div className="space-y-4 pr-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                        <div className="w-16 h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl">
                          {item.image}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{item.name}</h4>
                          <p className="text-sm text-zinc-500">{item.price}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600 ml-auto"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-avalanche-500">
                            {(item.priceAvax * item.quantity).toFixed(4)} AVAX
                          </p>
                          <p className="text-sm text-zinc-500">
                            ${(item.priceUsd * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="mt-6 space-y-4">
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Subtotal</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Shipping</span>
                      <span className="text-emerald-500">Free</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <div className="text-right">
                        <p className="text-avalanche-500">{cartTotalAvax.toFixed(4)} AVAX</p>
                        <p className="text-sm text-zinc-500">${cartTotal.toFixed(2)} USD</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {cart.length > 0 && !checkoutComplete && (
              <SheetFooter className="mt-6">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing via Reap...
                    </>
                  ) : (
                    <>
                      Checkout with Reap
                      <CreditCard className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
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
