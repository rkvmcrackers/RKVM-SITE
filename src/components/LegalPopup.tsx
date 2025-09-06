import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { X, AlertTriangle } from "lucide-react";

const LegalPopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen the popup
    const hasSeenPopup = localStorage.getItem('hasSeenLegalPopup');
    if (!hasSeenPopup) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Remember that user has seen the popup
    localStorage.setItem('hasSeenLegalPopup', 'true');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Important Legal Notice</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800 leading-relaxed">
              <strong>As per the 2018 Supreme Court order, online sale of firecrackers is not permitted.</strong>
            </p>
          </div>
          
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              We value our customers and respect legal jurisdiction. Here's how we can help you:
            </p>
            
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-primary font-bold">1.</span>
                <span>Add your desired products to the cart</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary font-bold">2.</span>
                <span>Submit your inquiry using the inquiry button</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary font-bold">3.</span>
                <span>We will contact you within 24 hours via WhatsApp or phone call</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary font-bold">4.</span>
                <span>Confirm your order and enjoy your Diwali with RKVM Crackers!</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              onClick={handleClose}
              className="bg-primary hover:bg-primary/90"
            >
              <X className="h-4 w-4 mr-2" />
              I Understand
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegalPopup;
