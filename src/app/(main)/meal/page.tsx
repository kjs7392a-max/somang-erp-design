"use client";

import { useAuth } from "@/context/AuthContext";
import { MealReservationView } from "@/components/views/MealReservationView";

export default function MealPage() {
  const { profile } = useAuth();
  if (!profile) return null;

  return <MealReservationView userId={profile.id} />;
}
