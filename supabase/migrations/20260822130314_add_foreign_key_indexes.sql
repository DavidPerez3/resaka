create index drinks_venue_idx on public.drinks (venue_id) where venue_id is not null;
create index outing_stops_venue_idx on public.outing_stops (venue_id);
create index outings_current_venue_idx on public.outings (current_venue_id) where current_venue_id is not null;
create index route_points_user_idx on public.route_points (user_id);
create index venues_creator_idx on public.venues (creator_id) where creator_id is not null;
