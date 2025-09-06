import { Mail, Phone, MapPin, Sparkles } from "lucide-react";

const Footer = () => {
  // Static contact details - no dynamic configuration needed
  const contactDetails = {
    phone: "9750153358",
    customerSupport: "7010918595",
    email: "rkvmpyrotech2021@gmail.com"
  };

  return (
    <footer className="bg-gradient-to-r from-primary/10 to-secondary/10 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg shadow-lg">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">RKVM Crackers</h3>
                <p className="text-sm text-muted-foreground">Festival Fireworks</p>
              </div>
            </div>
            <p className="text-muted-foreground max-w-sm">
              Your trusted partner for all festival celebrations. Quality fireworks and crackers 
              for every joyous occasion.
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-primary" />
                <a href={`tel:${contactDetails.phone}`} className="text-muted-foreground hover:text-foreground transition-colors">
                  {contactDetails.phone}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-primary" />
                <a href={`tel:${contactDetails.customerSupport}`} className="text-muted-foreground hover:text-foreground transition-colors">
                  Customer Support: {contactDetails.customerSupport}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-primary" />
                <a href={`mailto:${contactDetails.email}`} className="text-muted-foreground hover:text-foreground transition-colors">
                  {contactDetails.email}
                </a>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <a 
                  href="https://maps.app.goo.gl/Jjg2GE5mzbdNHtj96" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  View on Google Maps
                </a>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Business Hours</h4>
            <div className="space-y-2 text-muted-foreground">
              <p>Monday - Saturday: 9:00 AM - 9:00 PM</p>
              <p>Sunday: 10:00 AM - 8:00 PM</p>
              <p className="text-sm font-medium text-primary mt-3">
                Special festival hours during Diwali season!
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground">
            © 2024 RKVM Crackers. All rights reserved. | Made with ❤️ for festive celebrations
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;