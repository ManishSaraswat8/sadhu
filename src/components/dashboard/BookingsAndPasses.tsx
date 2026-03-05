import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  ExternalLink,
  Film,
  MapPin,
  Ticket,
  UserRound,
} from "lucide-react";
import { WellnessEndpoint, wellnessLivingEndpoints } from "@/config/wellnessLiving";

const iconByEndpointKey: Record<WellnessEndpoint["key"], typeof Calendar> = {
  booking: Calendar,
  inPerson: MapPin,
  threeFreeClassPass: Ticket,
  clientPortal: UserRound,
  archiveVideos: Film,
};

const isHttpUrl = (url: string) => /^https?:\/\//i.test(url);

const getPortalButtonLabel = (key: WellnessEndpoint["key"]) => {
  switch (key) {
    case "booking":
      return "Book Classes";
    case "inPerson":
      return "Book In-Person Sessions";
    case "threeFreeClassPass":
      return "Get 3 Free Class Pass";
    case "clientPortal":
      return "Open Client Portal";
    case "archiveVideos":
      return "Open Video Archive";
    default:
      return "Open WellnessLiving";
  }
};

export const BookingsAndPasses = () => {

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-light mb-2">Bookings & Passes</h1>
        <p className="text-muted-foreground">
          Access WellnessLiving booking, pass checkout, and client account tools from one place.
        </p>
      </div>

      <div className="grid gap-4">
        {wellnessLivingEndpoints.map((endpoint) => {
          const Icon = iconByEndpointKey[endpoint.key];
          const hasUrl = endpoint.url.trim().length > 0;

          return (
            <Card key={endpoint.key} className="border-primary/10">
              <CardHeader>
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    {endpoint.title}
                  </CardTitle>
                  <CardDescription>{endpoint.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {hasUrl &&
                    (isHttpUrl(endpoint.url) ? (
                      <Button asChild>
                        <a href={endpoint.url} target="_blank" rel="noopener noreferrer">
                          {getPortalButtonLabel(endpoint.key)}
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    ) : (
                      <Button asChild>
                        <Link to={endpoint.url}>{getPortalButtonLabel(endpoint.key)}</Link>
                      </Button>
                    ))}

                  {endpoint.key === "archiveVideos" && (
                    <Button variant="secondary" asChild>
                      <Link to="/step-by-step">View Archive</Link>
                    </Button>
                  )}
                </div>

                {!hasUrl && endpoint.key === "archiveVideos" && (
                  <p className="text-sm text-muted-foreground">
                    No WellnessLiving archive URL is configured yet. Use the Sadhu archive while the
                    WellnessLiving endpoint is finalized.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
