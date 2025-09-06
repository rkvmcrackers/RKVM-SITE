import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../hooks/use-toast";

import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from "lucide-react";
import emailjs from "@emailjs/browser";

const Contact = () => {
  // Static contact details - no dynamic configuration needed
  const contactDetails = {
    phone: "9750153358",
    customerSupport: "7010918595",
    email: "rkvmpyrotech2021@gmail.com",
    companyName: "RKVM Crackers"
  };
  
  // ✅ State for form inputs
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  // ✅ State for submit button loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Toast hook for feedback messages
  const { toast } = useToast();

  // ✅ Handle form input updates
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ Match EmailJS template exactly
      const response = await emailjs.send(
        "service_hgughra", // Your EmailJS Service ID
        "template_6m602sk", // Your EmailJS Template ID
        {
          name: formData.name,            // {{name}}
          email: formData.email,          // {{email}}
          phone: formData.phone || "Not provided", // {{phone}}
          subject: formData.subject || "No subject", // {{subject}}
          message: formData.message,      // {{message}}
        },
        "ON2G3ETmnRKPUJtXx" // Your Public Key
      );

      console.log("SUCCESS!", response.status, response.text);

      toast({
        title: "Message Sent Successfully! 📧",
        description: "We'll get back to you within 24 hours.",
        duration: 5000,
      });

      // ✅ Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("FAILED...", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

  // ✅ Contact Info Cards
  const contactInfo = [
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Phone",
      content: contactDetails.phone,
      action: `tel:${contactDetails.phone}`,
      description: "Call us for immediate assistance",
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Customer Support",
      content: contactDetails.customerSupport,
      action: `tel:${contactDetails.customerSupport}`,
      description: "Dedicated support for all your queries",
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email",
      content: contactDetails.email,
      action: `mailto:${contactDetails.email}`,
      description: "Send us your queries via email",
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Location",
      content: "Visit Store",
      action: "https://maps.app.goo.gl/Jjg2GE5mzbdNHtj96",
      description: "Find us on Google Maps",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Business Hours",
      content: "Mon-Sat: 9AM-9PM",
      description: "Sunday: 10AM-8PM",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ✅ Header Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <MessageCircle className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Contact Us
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get in touch with us for orders, inquiries, or any assistance. We're
            here to help make your celebrations memorable!
          </p>
        </div>
      </section>

      {/* ✅ Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* ✅ Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Get in Touch
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Whether you're planning a small family celebration or a grand
                festival event, our team is ready to help you choose the perfect
                fireworks. Reach out to us through any of the following
                channels.
              </p>
            </div>

            {/* ✅ Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {contactInfo.map((info, index) => (
                <Card
                  key={index}
                  className="card-glow hover:card-gold transition-all duration-300"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="bg-primary/10 p-2 sm:p-3 rounded-lg text-primary flex-shrink-0">
                        {info.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">
                          {info.title}
                        </h3>
                        {info.action ? (
                          <a
                            href={info.action}
                            target={info.action.startsWith("http") ? "_blank" : undefined}
                            rel={
                              info.action.startsWith("http")
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className="text-primary hover:text-primary/80 font-medium break-words overflow-wrap-anywhere text-xs sm:text-sm block"
                          >
                            {info.content}
                          </a>
                        ) : (
                          <p className="text-foreground font-medium break-words overflow-wrap-anywhere text-xs sm:text-sm">
                            {info.content}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ✅ Google Maps */}
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>Find Our Store</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg overflow-hidden border">
                  <iframe
                    src="https://maps.google.com/maps?width=100%25&amp;height=300&amp;hl=en&amp;q=RKVM%20Crackers&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="RKVM Crackers Location"
                  />
                </div>
                <div className="mt-4 text-center">
                  <Button variant="outline" asChild>
                    <a
                      href="https://maps.app.goo.gl/Jjg2GE5mzbdNHtj96"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open in Google Maps
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ✅ Contact Form */}
          <div>
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="h-5 w-5 text-primary" />
                  <span>Send us a Message</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Your full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="Your phone number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange("subject", e.target.value)}
                      placeholder="What's this about?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder="Tell us about your requirements, questions, or how we can help you..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-festive w-full"
                  >
                    {isSubmitting ? (
                      "Sending Message..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* ✅ Quick Contact Options */}
            <Card className="mt-6 card-glow">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  Need Immediate Assistance?
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="btn-success flex-1" asChild>
                    <a href={`tel:${contactDetails.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call Now
                    </a>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={`tel:${contactDetails.customerSupport}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Customer Support
                    </a>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={`mailto:${contactDetails.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
