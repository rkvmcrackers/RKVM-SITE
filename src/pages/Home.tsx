import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Link } from "react-router-dom";
import { Sparkles, Star, Shield, Clock, Award, PhoneCall } from "lucide-react";
import heroImage from "../assets/hero-fireworks.jpg";
import { useHighlights } from "../hooks/use-highlights";

const Home = () => {
  const { highlights, loading } = useHighlights();
  
  const features = [
    {
      icon: <Star className="h-8 w-8 text-secondary" />,
      title: "Premium Quality",
      description: "Carefully selected fireworks from trusted manufacturers for the best experience."
    },
    {
      icon: <Shield className="h-8 w-8 text-festive" />,
      title: "Safe & Certified",
      description: "All products are safety certified and tested for reliable performance."
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Fast Delivery",
      description: "Quick and secure delivery right to your doorstep in time for celebrations."
    },
    {
      icon: <Award className="h-8 w-8 text-secondary" />,
      title: "Best Prices",
      description: "Competitive pricing with special festival discounts and bulk offers."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative h-[70vh] md:h-[80vh] flex items-center justify-center text-center text-white"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sparkle">
            <Sparkles className="h-16 w-16 text-secondary mx-auto mb-6" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            RKVM Crackers
          </h1>
          <p className="text-xl md:text-2xl mb-8 drop-shadow-md">
            Light up your celebrations with premium quality fireworks
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/quick-purchase">
              <Button size="lg" className="btn-festive text-lg px-8 py-3">
                Shop Now
              </Button>
            </Link>
            <Link to="/price-list">
              <Button size="lg" variant="outline" className="text-primary border-white hover:bg-white hover:text-primary text-lg px-8 py-3">
                View Prices
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              About RKVM Crackers
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              For years, we have been your trusted partner in making celebrations memorable. 
              Our extensive collection of fireworks and crackers brings joy, excitement, and 
              sparkle to every festival and special occasion.
            </p>
          </div>

{/* 🔥 News Highlights Scrolling Section */}
<div className="relative overflow-hidden mb-12">
  <div className="bg-red-600 text-white rounded-md shadow-md">
    <div className="p-4">
      <div className="overflow-hidden">
        {!loading && highlights.length > 0 && (
          <div className="flex animate-marquee whitespace-nowrap">
            {/* Original + duplicate in one line */}
            {[...highlights, ...highlights].map((item, idx) => (
              <span key={idx} className="inline-block mr-8">
                {item}
              </span>
            ))}
          </div>
        )}
        {loading && (
          <div className="text-center py-2">
            <span>Loading highlights...</span>
          </div>
        )}
      </div>
    </div>
  </div>
</div>



          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-foreground">
                Your Festival Celebration Partner
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                From traditional Diwali celebrations to New Year festivities, weddings, and 
                special events, RKVM Crackers offers a comprehensive range of fireworks 
                suitable for every occasion. We understand the importance of quality and 
                safety in celebrations, which is why every product in our inventory is 
                carefully selected and tested.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our commitment extends beyond just selling fireworks – we aim to create 
                magical moments that families will treasure forever. With years of experience 
                and thousands of satisfied customers, we continue to be the preferred choice 
                for quality fireworks.
              </p>
              <div className="flex items-center space-x-4">
                <Link to="/contact">
                  <Button className="btn-success">
                    <PhoneCall className="h-4 w-4 mr-2" />
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="card-glow text-center p-6">
                <CardContent className="space-y-2">
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Products Available</div>
                </CardContent>
              </Card>
              <Card className="card-glow text-center p-6">
                <CardContent className="space-y-2">
                  <div className="text-3xl font-bold text-secondary">500+</div>
                  <div className="text-sm text-muted-foreground">Happy Customers</div>
                </CardContent>
              </Card>
              <Card className="card-glow text-center p-6">
                <CardContent className="space-y-2">
                  <div className="text-3xl font-bold text-festive">5+</div>
                  <div className="text-sm text-muted-foreground">Years Experience</div>
                </CardContent>
              </Card>
              <Card className="card-glow text-center p-6">
                <CardContent className="space-y-2">
                  <div className="text-3xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Customer Support</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-gradient-to-r from-accent/30 to-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose RKVM Crackers?
            </h2>
            <p className="text-lg text-muted-foreground">
              Experience the difference with our premium quality and exceptional service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-glow text-center hover:card-gold transition-all duration-300">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 rounded-full bg-accent">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Light Up Your Celebration?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Browse our extensive collection and place your order today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/quick-purchase">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Start Shopping
              </Button>
            </Link>
            <Link to="/price-list">
              <Button size="lg" variant="outline" className="text-primary border-white hover:bg-white hover:text-primary text-lg px-8 py-3">
                See All Prices
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

/* ✅ Add this CSS in your global styles (index.css / tailwind.css) */
