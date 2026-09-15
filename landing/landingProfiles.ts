export type LandingProfile = {
  id: string;
  name: string;
  location: string;
  rating: string;
  avatar: string;
  available: boolean;
  offer: string;
  want: string;
};

export const landingProfiles: LandingProfile[] = [
  {
    id: "alice",
    name: "Alice Johnson",
    location: "New York, USA",
    rating: "4.8",
    avatar: "https://i.pravatar.cc/96?u=alice-johnson",
    available: true,
    offer: "Graphic Design",
    want: "Web Development",
  },
  {
    id: "bob",
    name: "Bob Smith",
    location: "London, UK",
    rating: "4.6",
    avatar: "https://i.pravatar.cc/96?u=bob-smith",
    available: false,
    offer: "Photography",
    want: "Content Writing",
  },
  {
    id: "carol",
    name: "Carol Lee",
    location: "Berlin, Germany",
    rating: "4.9",
    avatar: "https://i.pravatar.cc/96?u=carol-lee",
    available: true,
    offer: "UI/UX Design",
    want: "SEO",
  },
  {
    id: "daniel",
    name: "Daniel Kim",
    location: "Seoul, South Korea",
    rating: "4.7",
    avatar: "https://i.pravatar.cc/96?u=daniel-kim",
    available: true,
    offer: "Video Editing",
    want: "Script Writing",
  },
  {
    id: "eva",
    name: "Eva Brown",
    location: "Toronto, Canada",
    rating: "4.5",
    avatar: "https://i.pravatar.cc/96?u=eva-brown",
    available: false,
    offer: "Voice Over",
    want: "Animation",
  },
  {
    id: "frank",
    name: "Frank Zhao",
    location: "Beijing, China",
    rating: "4.8",
    avatar: "https://i.pravatar.cc/96?u=frank-zhao",
    available: true,
    offer: "Thai Tutor",
    want: "Proofreading",
  },
];
