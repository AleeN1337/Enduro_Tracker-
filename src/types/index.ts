export interface EnduroSpot {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  difficulty: "easy" | "moderate" | "hard" | "extreme";
  categories: ("climb" | "technical" | "jump" | "creek" | "rocks" | "mud")[];
  rating: number;
  images: string[];
  createdBy: string;
  createdAt: Date;
  tags: string[];
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp: number;
}

export interface TrackingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  distance: number;
  maxSpeed: number;
  averageSpeed: number;
  route: UserLocation[];
  spotsVisited: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  totalDistance: number;
  ridesCount: number;
  favoriteSpots: string[];
}

export type RootStackParamList = {
  Home: undefined;
  Map: undefined;
  AddSpot: { location?: UserLocation };
  SpotDetails: { spotId: string };
  Profile: undefined;
  Tracking: undefined;
};

export type BottomTabParamList = {
  MapTab: undefined;
  SpotsTab: undefined;
  TrackingTab: undefined;
  ProfileTab: undefined;
};
