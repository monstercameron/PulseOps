import { MarketingHomePage } from "@/features/marketing/components/marketing-pages";
import { type WebsiteDetails } from "@/features/marketing/domain/website-details";

type HomePageProps = Readonly<{
  websiteDetails: WebsiteDetails;
}>;

export function HomePage({ websiteDetails }: HomePageProps) {
  return <MarketingHomePage websiteDetails={websiteDetails} />;
}
