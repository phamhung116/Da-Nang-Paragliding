import { Link } from "react-router-dom";
import { Button } from "@paragliding/ui";
import { useI18n } from "@/shared/providers/i18n-provider";
import { businessInfo } from "@/shared/constants/business";
import { routes } from "@/shared/config/routes";
import { motion } from 'motion/react';

export const HomeHero = () => {
  const { t } = useI18n();

  return (
    <section className="relative h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://picsum.photos/seed/paragliding-hero/1920/1080"
          alt="Paragliding in Da Nang"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      <div className="relative z-10 w-full px-6 md:px-16 text-white">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl"
        >
          <span className="inline-block px-3 py-1 md:px-4 md:py-1 bg-brand/80 backdrop-blur-sm rounded-full text-[10px] md:text-xs font-bold tracking-widest uppercase mb-4 md:mb-6">
            {t("hero_kicker")}
          </span>
          <h1 className="text-4xl md:text-7xl font-bold leading-[1.3] md:leading-[1.2] mb-6 md:mb-8 tracking-tight">
            {t("hero_title_line_1")}
            <br />
            <span className="text-brand-light">{t("hero_title_line_2")}</span>
          </h1>
          <p className="text-sm md:text-lg text-stone-200 mb-8 md:mb-10 leading-relaxed max-w-md md:max-w-none">
            {businessInfo.intro}
          </p>
          <div className="flex flex-wrap gap-3 md:gap-4">
            <Link to={routes.services}>
              <Button className="btn-primary text-sm md:text-lg px-6 py-3 md:px-10 md:py-4">
                {t("hero_services")}
              </Button>
            </Link>
            <Link to={routes.about}>
              <Button  className="btn-secondary border-white text-white hover:bg-white hover:text-brand text-sm md:text-lg px-6 py-3 md:px-10 md:py-4">{t("hero_about")}</Button>
            </Link>
          </div>
        </motion.div>
        
      </div>
    </section>
  );
};
