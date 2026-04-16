import type { ComponentPropsWithoutRef } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import clsx from "clsx";

export const Tabs = ({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Root>) => (
  <TabsPrimitive.Root className={clsx("ui-tabs", className)} {...props} />
);

export const TabsList = ({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List className={clsx("ui-tabs__list", className)} {...props} />
);

export const TabsTrigger = ({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger className={clsx("ui-tabs__trigger", className)} {...props} />
);

export const TabsContent = ({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={clsx("ui-tabs__content", className)} {...props} />
);
