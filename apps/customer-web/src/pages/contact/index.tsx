import { Link } from "react-router-dom";
import { Badge, Button, Container } from "@paragliding/ui";
import { routes } from "@/shared/config/routes";
import { businessInfo } from "@/shared/constants/business";
import { SiteLayout, Banner } from "@/widgets/layout/site-layout";
import { motion } from "motion/react";

import {
  FaFacebook,
} from "react-icons/fa6";

import {
  Phone,
  Mail,
  MapPin,
} from "lucide-react"

const normalizedPhone = businessInfo.phone.replace(/\s+/g, "");
const contactMethods = [
  {
    label: "Hotline",
    value: businessInfo.phone,
    href: `tel:${normalizedPhone}`,
    icon: <Phone size={20} />,
  },
  {
    label: "Email",
    value: businessInfo.email,
    href: `mailto:${businessInfo.email}`,
    icon: <Mail size={20} />,
  },
  {
    label: "Địa chỉ",
    value: businessInfo.address,
    icon: <MapPin size={20} />,
  }
];

export const ContactPage = () => (
  <SiteLayout>
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="pb-20"
    >
      <Banner 
        title="Liên Hệ" 
        subtitle="Bạn có thắc mắc hoặc muốn đặt lịch bay? Hãy liên hệ với chúng tôi qua các kênh dưới đây."
        image="https://images.unsplash.com/photo-1596263576925-d90d63691097?auto=format&fit=crop&q=80&w=1920"
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Container className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-stone-900">Liên Hệ Với Chúng Tôi</h2>
              <p className="text-xs md:text-sm text-stone-600 mb-10 leading-relaxed">
                Bạn có thắc mắc hoặc muốn đặt lịch bay? Hãy liên hệ với chúng tôi qua các kênh dưới đây hoặc để lại lời nhắn.
              </p>

            <div className="space-y-6 mb-10">
              {contactMethods.map((method) => (
                <div key={method.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-stone-100 text-brand rounded-xl flex items-center justify-center shrink-0">
                    {method.icon}
                  </div>
                  <div>
                    <a href={method.href}><p className="text-[9px] font-bold text-stone-400 uppercase mb-0.5">{method.label}</p></a>
                    <a href={method.href}><p className="text-sm md:text-base font-bold text-stone-900">{method.value}</p></a>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-brand transition-colors cursor-pointer"><a href="https://www.facebook.com/profile.php?id=100064087207931"><FaFacebook /></a></div>
              <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-brand transition-colors cursor-pointer"><a href="https://zalo.me/0935101188" className="flex items-center justify-center w-full h-full"><img src="https://conex-agency.com/images/icon_zalo9.png" alt="" style={{width: "50%"}}/></a></div>
            </div>
          </div>

          <div className="h-[400px] md:h-[500px] rounded-[32px] overflow-hidden shadow-xl border border-stone-200">
            <iframe
              title="Da Nang Paragliding contact map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15334.46083321591!2d108.261895!3d16.110555!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3142179635634967%3A0x584460af3013973d!2zQsOhbiDEkeG6o28gU8ahbiBUcsOg!5e0!3m2!1svi!2svn!4v1710670000000!5m2!1svi!2svn" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-popups allow-same-origin allow-scripts"
            ></iframe>
          </div>
        </Container>
      </section>
    </motion.div>
  </SiteLayout>
);
