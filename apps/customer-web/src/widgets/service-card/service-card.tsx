import { memo } from "react";
import { Link } from "react-router-dom";
import type { ServiceFeature, ServicePackage } from "@paragliding/api-client";
import { Button, Card, Panel } from "@paragliding/ui";
import { formatCurrency } from "@/shared/lib/format";
import {
  localizeFeatureName,
  localizeServiceName,
  localizeServiceShortDescription
} from "@/shared/lib/localized-content";
import { useI18n } from "@/shared/providers/i18n-provider";

type ServiceCardProps = {
  item: ServicePackage;
};

const ServiceFeatureChip = ({ feature }: { feature: ServiceFeature }) => {
  const { locale } = useI18n();
  const label = localizeFeatureName(feature, locale);

  return <span>{label}</span>;
};

const ServiceCardComponent = ({ item }: ServiceCardProps) => {
  const { locale, t } = useI18n();
  const name = localizeServiceName(item, locale);
  const shortDescription = localizeServiceShortDescription(item, locale);

  return (
    <Link to={`/services/${item.slug}`}>
      <Card className="bg-white rounded-[24px] md:rounded-[32px] overflow-hidden shadow-sm border border-stone-100 flex flex-row md:flex-col group hover:shadow-xl transition-all duration-500 cursor-pointer">
        <div className="w-32 h-32 md:w-full md:h-64 overflow-hidden relative flex-shrink-0">
          <img
            src={item.hero_image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        </div>

        <Panel className="package-card__body">
          <h3>{name}</h3>
          <p>{shortDescription}</p>

          {item.included_features.length > 0 ? (
            <div className="package-card__feature-list">
              {item.included_features.slice(0, 5).map((feature) => (
                <ServiceFeatureChip key={feature.id} feature={feature} />
              ))}
            </div>
          ) : null}

          <div className="package-card__footer">
            <div className="package-card__price">
              <small>{t("price_from")}</small>
              <strong>{formatCurrency(item.price)}</strong>
            </div>
            <div className="package-card__actions">
              <Link to={`/services/${item.slug}`}>
                <Button variant="secondary">{t("view_detail")}</Button>
              </Link>
            </div>
          </div>
        </Panel>
      </Card>
    </Link>
  );
};

ServiceCardComponent.displayName = "ServiceCard";

export const ServiceCard = memo(ServiceCardComponent);
