import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin 
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">DocVerify</h3>
            <p className="text-sm">
              Secure and reliable document verification platform for educational institutions.
            </p>
            <div className="flex space-x-4">
              <SocialIcon Icon={Facebook} href="#" />
              <SocialIcon Icon={Twitter} href="#" />
              <SocialIcon Icon={Instagram} href="#" />
              <SocialIcon Icon={Linkedin} href="#" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <FooterLink text="Home" href="#" />
              <FooterLink text="About Us" href="#" />
              <FooterLink text="Services" href="#" />
              <FooterLink text="Contact" href="#" />
              <FooterLink text="Privacy Policy" href="#" />
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Our Services</h4>
            <ul className="space-y-2">
              <FooterLink text="DocVerify Verification" href="#" />
              <FooterLink text="AI Analysis" href="#" />
              <FooterLink text="Bulk Processing" href="#" />
              <FooterLink text="API Access" href="#" />
              <FooterLink text="Enterprise Solutions" href="#" />
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                <span className="text-sm">support@docverify.com</span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                <span className="text-sm">123 Verification Street, Tech City, TC 12345</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">
              © {new Date().getFullYear()} DocVerify. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <button className="text-sm hover:text-white transition-colors">
                Terms of Service
              </button>
              <button className="text-sm hover:text-white transition-colors">
                Privacy Policy
              </button>
              <button className="text-sm hover:text-white transition-colors">
                Cookie Policy
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Helper Components
const SocialIcon = ({ Icon, href }) => (
  <a 
    href={href}
    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-blue-600 transition-colors"
  >
    <Icon className="w-4 h-4" />
  </a>
);

const FooterLink = ({ text, href }) => (
  <li>
    <a 
      href={href}
      className="text-sm hover:text-white transition-colors"
    >
      {text}
    </a>
  </li>
);

export default Footer;