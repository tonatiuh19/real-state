import React, { useEffect, useState } from "react";
import { Users, Search, Link2, ChevronDown, ChevronRight } from "lucide-react";
import { MetaHelmet } from "@/components/MetaHelmet";
import { PageHeader } from "@/components/layout/PageHeader";
import { adminPageMeta } from "@/lib/seo-helpers";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCrmPeople } from "@/store/slices/crmSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const CrmPeople = () => {
  const dispatch = useAppDispatch();
  const { peopleGroups, isLoadingPeople, peoplePagination } = useAppSelector(
    (s) => s.crm,
  );
  const user = useAppSelector((s) => s.brokerAuth.user);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const isPlatformOwner = user?.role === "platform_owner";

  useEffect(() => {
    if (isPlatformOwner) {
      dispatch(fetchCrmPeople({ search: search || undefined }));
    }
  }, [dispatch, isPlatformOwner, search]);

  if (!isPlatformOwner) {
    return (
      <div className="p-6 text-muted-foreground">
        Platform owner access is required for the People view.
      </div>
    );
  }

  const totalPeoplePages = peoplePagination
    ? Math.max(1, Math.ceil(peoplePagination.total / peoplePagination.limit))
    : 1;

  return (
    <>
      <MetaHelmet {...adminPageMeta("CRM People", "Phone-grouped CRM view")} />
      <div className="flex flex-col h-full min-h-0 gap-4 p-4 md:p-6">
        <PageHeader
          title="People"
          description="Same phone number across mortgage bankers — link, transfer, or merge"
          icon={<Users className="h-5 w-5" />}
        />

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by phone or digits…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoadingPeople ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
          </div>
        ) : peopleGroups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No phone groups found. Duplicate phones appear here once per-owner
              CRM is enabled and bankers save the same number.
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="flex-1">
            <div className="space-y-3 pb-8">
              {peopleGroups.map((group) => {
                const key = group.normalized_phone;
                const isOpen = expanded[key] ?? group.member_count <= 3;
                return (
                  <Card key={key} className="overflow-hidden">
                    <CardHeader
                      className="py-3 px-4 cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() =>
                        setExpanded((p) => ({ ...p, [key]: !isOpen }))
                      }
                    >
                      <div className="flex items-center gap-3">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        )}
                        <CardTitle className="text-base font-semibold flex-1">
                          {group.display_phone || group.normalized_phone}
                        </CardTitle>
                        <Badge variant="secondary">
                          {group.member_count} row
                          {group.member_count !== 1 ? "s" : ""}
                        </Badge>
                        {group.members.some((m) => m.link_group_id) && (
                          <Badge className="bg-primary/10 text-primary border-0">
                            <Link2 className="h-3 w-3 mr-1" />
                            Linked
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    {isOpen && (
                      <CardContent className="px-4 pb-4 pt-0">
                        <ul className="divide-y rounded-lg border">
                          {group.members.map((m) => (
                            <li
                              key={m.client_id}
                              className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-sm"
                            >
                              <span className="font-medium">
                                {m.first_name} {m.last_name}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                #{m.client_id}
                              </span>
                              {m.assigned_broker_name && (
                                <Badge variant="outline" className="text-xs">
                                  {m.assigned_broker_name}
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs ml-auto",
                                  m.list_visibility !== "active" &&
                                    "text-amber-600 border-amber-300",
                                )}
                              >
                                {m.list_visibility}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {peoplePagination && totalPeoplePages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={peoplePagination.page <= 1}
              onClick={() =>
                dispatch(
                  fetchCrmPeople({
                    page: peoplePagination.page - 1,
                    search: search || undefined,
                  }),
                )
              }
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground self-center">
              Page {peoplePagination.page} of {totalPeoplePages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={peoplePagination.page >= totalPeoplePages}
              onClick={() =>
                dispatch(
                  fetchCrmPeople({
                    page: peoplePagination.page + 1,
                    search: search || undefined,
                  }),
                )
              }
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default CrmPeople;
