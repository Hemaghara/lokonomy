import React from 'react';
import {
  ShoppingCart,
  Croissant,
  Milk,
  Store,
  Carrot,
  Apple,
  Wheat,
  Stethoscope,
  User,
  Smile,
  Baby,
  Bone,
  Droplet,
  Scissors,
  Flower2,
  Sparkles,
  Dumbbell,
  Hospital,
  Pill,
  Microscope,
  Bed,
  Wrench,
  Lightbulb,
  Hammer,
  Palette,
  Snowflake,
  Shirt,
  Footprints,
  Wind,
  Bug,
  ShoppingBag,
  Smartphone,
  Monitor,
  Headphones,
  Banknote,
  BarChart,
  Shield,
  Landmark,
  TrendingUp,
  Utensils,
  Coffee,
  Pizza,
  Briefcase,
  BookOpen,
  School,
  Book,
  GraduationCap,
  Pencil,
  Music,
  Trophy,
  Home,
  Handshake,
  Building2,
  Key,
  FileText,
  Scale,
  Rocket,
  Droplets,
  Speaker,
  Circle,
  Car,
  Bike,
  Settings,
  Bell,
  Leaf,
  FlaskConical,
  Tractor,
  Factory,
  Box,
  Package,
  TrendingDown,
  ShieldCheck,
  Mail,
  Plane,
  Umbrella,
  Ticket,
  FileCheck,
  TreePine,
  Heart,
  Gift,
  Camera,
  Clipboard,
  File,
  Printer,
  Newspaper,
  Image as ImageIcon,
  Tag,
  Dog,
  HelpCircle,
  Activity,
  Building
} from 'lucide-react';

// Reusable Tailwind color tokens.
// Use category.color.bg for card/icon background, category.color.text for icon/text color,
// category.color.hover for hover state, category.color.ring for focus/active border.
const COLORS = {
  orange:  { bg: "bg-orange-50",  text: "text-orange-600",  hover: "hover:bg-orange-100",  ring: "ring-orange-400"  },
  blue:    { bg: "bg-blue-50",    text: "text-blue-600",    hover: "hover:bg-blue-100",    ring: "ring-blue-400"    },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", hover: "hover:bg-emerald-100", ring: "ring-emerald-400" },
  pink:    { bg: "bg-pink-50",    text: "text-pink-600",    hover: "hover:bg-pink-100",    ring: "ring-pink-400"    },
  purple:  { bg: "bg-purple-50",  text: "text-purple-600",  hover: "hover:bg-purple-100",  ring: "ring-purple-400"  },
  amber:   { bg: "bg-amber-50",   text: "text-amber-600",   hover: "hover:bg-amber-100",   ring: "ring-amber-400"   },
  red:     { bg: "bg-red-50",     text: "text-red-600",     hover: "hover:bg-red-100",     ring: "ring-red-400"    },
  teal:    { bg: "bg-teal-50",    text: "text-teal-600",    hover: "hover:bg-teal-100",    ring: "ring-teal-400"    },
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-600",  hover: "hover:bg-indigo-100",  ring: "ring-indigo-400"  },
  cyan:    { bg: "bg-cyan-50",    text: "text-cyan-600",    hover: "hover:bg-cyan-100",    ring: "ring-cyan-400"    },
  lime:    { bg: "bg-lime-50",    text: "text-lime-600",    hover: "hover:bg-lime-100",    ring: "ring-lime-400"    },
  rose:    { bg: "bg-rose-50",    text: "text-rose-600",    hover: "hover:bg-rose-100",    ring: "ring-rose-400"    },
  sky:     { bg: "bg-sky-50",     text: "text-sky-600",     hover: "hover:bg-sky-100",     ring: "ring-sky-400"    },
  fuchsia: { bg: "bg-fuchsia-50", text: "text-fuchsia-600", hover: "hover:bg-fuchsia-100", ring: "ring-fuchsia-400" },
  violet:  { bg: "bg-violet-50",  text: "text-violet-600",  hover: "hover:bg-violet-100",  ring: "ring-violet-400"  },
  yellow:  { bg: "bg-yellow-50",  text: "text-yellow-600",  hover: "hover:bg-yellow-100",  ring: "ring-yellow-400"  },
  green:   { bg: "bg-green-50",   text: "text-green-600",   hover: "hover:bg-green-100",   ring: "ring-green-400"   },
  slate:   { bg: "bg-slate-50",   text: "text-slate-600",   hover: "hover:bg-slate-100",   ring: "ring-slate-400"   },
};

export const categories = [
  { 
    id: 1, 
    name: "Daily Needs", 
    icon: <ShoppingCart className="w-6 h-6" />, 
    color: COLORS.orange,
    subcategories: [
      { name: "Bakery", icon: <Croissant className="w-5 h-5" /> },
      { name: "Dairy", icon: <Milk className="w-5 h-5" /> },
      { name: "Grocery", icon: <Store className="w-5 h-5" /> },
      { name: "Vegetables", icon: <Carrot className="w-5 h-5" /> },
      { name: "Fruits", icon: <Apple className="w-5 h-5" /> },
      { name: "Flour Mill", icon: <Wheat className="w-5 h-5" /> }
    ]
  },
  { 
    id: 2, 
    name: "Doctor", 
    icon: <Stethoscope className="w-6 h-6" />, 
    color: COLORS.blue,
    subcategories: [
      { name: "General Physician", icon: <User className="w-5 h-5" /> },
      { name: "Dentist", icon: <Smile className="w-5 h-5" /> },
      { name: "Pediatrician", icon: <Baby className="w-5 h-5" /> },
      { name: "Orthopedic", icon: <Bone className="w-5 h-5" /> },
      { name: "Dermatologist", icon: <Droplet className="w-5 h-5" /> }
    ]
  },
  { 
    id: 3, 
    name: "Personal Care", 
    icon: <Scissors className="w-6 h-6" />, 
    color: COLORS.pink,
    subcategories: [
      { name: "Salon", icon: <Scissors className="w-5 h-5" /> },
      { name: "Spa", icon: <Flower2 className="w-5 h-5" /> },
      { name: "Beauty Parlour", icon: <Sparkles className="w-5 h-5" /> },
      { name: "Gym", icon: <Dumbbell className="w-5 h-5" /> },
      { name: "Barber", icon: <Scissors className="w-5 h-5" /> }
    ]
  },
  { 
    id: 4, 
    name: "Healthcare", 
    icon: <Hospital className="w-6 h-6" />, 
    color: COLORS.red,
    subcategories: [
      { name: "Pharmacy", icon: <Pill className="w-5 h-5" /> },
      { name: "Lab", icon: <Microscope className="w-5 h-5" /> },
      { name: "Hospital", icon: <Hospital className="w-5 h-5" /> },
      { name: "Clinic", icon: <Stethoscope className="w-5 h-5" /> },
      { name: "Nursing Home", icon: <Bed className="w-5 h-5" /> }
    ]
  },
  { 
    id: 5, 
    name: "Services", 
    icon: <Wrench className="w-6 h-6" />, 
    color: COLORS.slate,
    subcategories: [
      { name: "Plumber", icon: <Wrench className="w-5 h-5" /> },
      { name: "Electrician", icon: <Lightbulb className="w-5 h-5" /> },
      { name: "Carpenter", icon: <Hammer className="w-5 h-5" /> },
      { name: "Painter", icon: <Palette className="w-5 h-5" /> },
      { name: "AC Repair", icon: <Snowflake className="w-5 h-5" /> }
    ]
  },
  { 
    id: 6, 
    name: "Fashion", 
    icon: <Shirt className="w-6 h-6" />, 
    color: COLORS.fuchsia,
    subcategories: [
      { name: "Men's Wear", icon: <Shirt className="w-5 h-5" /> },
      { name: "Women's Wear", icon: <Shirt className="w-5 h-5" /> },
      { name: "Kids Wear", icon: <Baby className="w-5 h-5" /> },
      { name: "Footwear", icon: <Footprints className="w-5 h-5" /> },
      { name: "Tailor", icon: <Scissors className="w-5 h-5" /> }
    ]
  },
  { 
    id: 7, 
    name: "Home Care", 
    icon: <Wind className="w-6 h-6" />, 
    color: COLORS.cyan,
    subcategories: [
      { name: "Cleaning", icon: <Droplet className="w-5 h-5" /> },
      { name: "Pest Control", icon: <Bug className="w-5 h-5" /> },
      { name: "Maid Service", icon: <Wind className="w-5 h-5" /> },
      { name: "Laundry", icon: <ShoppingBag className="w-5 h-5" /> }
    ]
  },
  { 
    id: 8, 
    name: "Electronics", 
    icon: <Smartphone className="w-6 h-6" />, 
    color: COLORS.indigo,
    subcategories: [
      { name: "Mobile Shop", icon: <Smartphone className="w-5 h-5" /> },
      { name: "Computer Shop", icon: <Monitor className="w-5 h-5" /> },
      { name: "Repair", icon: <Wrench className="w-5 h-5" /> },
      { name: "Accessories", icon: <Headphones className="w-5 h-5" /> }
    ]
  },
  { 
    id: 9, 
    name: "Finance", 
    icon: <Banknote className="w-6 h-6" />, 
    color: COLORS.emerald,
    subcategories: [
      { name: "CA / Accountant", icon: <BarChart className="w-5 h-5" /> },
      { name: "Insurance Agent", icon: <Shield className="w-5 h-5" /> },
      { name: "Loan Agent", icon: <Landmark className="w-5 h-5" /> },
      { name: "Investment Advisor", icon: <TrendingUp className="w-5 h-5" /> }
    ]
  },
  { 
    id: 10, 
    name: "Food", 
    icon: <Pizza className="w-6 h-6" />, 
    color: COLORS.amber,
    subcategories: [
      { name: "Restaurant", icon: <Utensils className="w-5 h-5" /> },
      { name: "Cafe", icon: <Coffee className="w-5 h-5" /> },
      { name: "Street Food", icon: <Pizza className="w-5 h-5" /> },
      { name: "Catering", icon: <Utensils className="w-5 h-5" /> },
      { name: "Tiffin Service", icon: <Briefcase className="w-5 h-5" /> }
    ]
  },
  { 
    id: 11, 
    name: "Education", 
    icon: <BookOpen className="w-6 h-6" />, 
    color: COLORS.violet,
    subcategories: [
      { name: "School", icon: <School className="w-5 h-5" /> },
      { name: "Tuition Classes", icon: <Book className="w-5 h-5" /> },
      { name: "College", icon: <GraduationCap className="w-5 h-5" /> },
      { name: "Library", icon: <Book className="w-5 h-5" /> },
      { name: "Stationery", icon: <Pencil className="w-5 h-5" /> }
    ]
  },
  { 
    id: 12, 
    name: "Hobby Classes", 
    icon: <Palette className="w-6 h-6" />, 
    color: COLORS.rose,
    subcategories: [
      { name: "Dance", icon: <Music className="w-5 h-5" /> },
      { name: "Music", icon: <Music className="w-5 h-5" /> },
      { name: "Art & Craft", icon: <Palette className="w-5 h-5" /> },
      { name: "Sports Coaching", icon: <Trophy className="w-5 h-5" /> }
    ]
  },
  { 
    id: 13, 
    name: "Business Classes", 
    icon: <Briefcase className="w-6 h-6" />, 
    color: COLORS.sky,
    subcategories: [
      { name: "Digital Marketing", icon: <Smartphone className="w-5 h-5" /> },
      { name: "Coding/IT", icon: <Monitor className="w-5 h-5" /> },
      { name: "Management", icon: <BarChart className="w-5 h-5" /> },
      { name: "Vocational Training", icon: <Wrench className="w-5 h-5" /> }
    ]
  },
  { 
    id: 14, 
    name: "Real Estate", 
    icon: <Home className="w-6 h-6" />, 
    color: COLORS.teal,
    subcategories: [
      { name: "Broker", icon: <Handshake className="w-5 h-5" /> },
      { name: "Builder", icon: <Building2 className="w-5 h-5" /> },
      { name: "Rental Agency", icon: <Key className="w-5 h-5" /> },
      { name: "Hostel/PG", icon: <Bed className="w-5 h-5" /> }
    ]
  },
  { 
    id: 15, 
    name: "Business Consultant", 
    icon: <TrendingUp className="w-6 h-6" />, 
    color: COLORS.lime,
    subcategories: [
      { name: "Tax Consultant", icon: <FileText className="w-5 h-5" /> },
      { name: "Legal Advisor", icon: <Scale className="w-5 h-5" /> },
      { name: "Startup Consultant", icon: <Rocket className="w-5 h-5" /> }
    ]
  },
  { 
    id: 16, 
    name: "Auto Care", 
    icon: <Wrench className="w-6 h-6" />, 
    color: COLORS.yellow,
    subcategories: [
      { name: "Garage", icon: <Wrench className="w-5 h-5" /> },
      { name: "Car Washing", icon: <Droplets className="w-5 h-5" /> },
      { name: "Car Accessories", icon: <Speaker className="w-5 h-5" /> },
      { name: "Tyre Shop", icon: <Circle className="w-5 h-5" /> }
    ]
  },
  { 
    id: 17, 
    name: "Car", 
    icon: <Car className="w-6 h-6" />, 
    color: COLORS.blue,
    subcategories: [
      { name: "Showroom", icon: <Building2 className="w-5 h-5" /> },
      { name: "Second Hand Dealer", icon: <Car className="w-5 h-5" /> },
      { name: "Car Rental", icon: <Car className="w-5 h-5" /> },
      { name: "Driving School", icon: <Activity className="w-5 h-5" /> }
    ]
  },
  { 
    id: 18, 
    name: "Bike", 
    icon: <Bike className="w-6 h-6" />, 
    color: COLORS.orange,
    subcategories: [
      { name: "Showroom", icon: <Building2 className="w-5 h-5" /> },
      { name: "Service Center", icon: <Wrench className="w-5 h-5" /> },
      { name: "Bike Rental", icon: <Bike className="w-5 h-5" /> },
      { name: "Spare Parts", icon: <Settings className="w-5 h-5" /> }
    ]
  },
  { 
    id: 19, 
    name: "Cycle", 
    icon: <Bike className="w-6 h-6" />, 
    color: COLORS.green,
    subcategories: [
      { name: "Cycle Shop", icon: <Store className="w-5 h-5" /> },
      { name: "Repair", icon: <Wrench className="w-5 h-5" /> },
      { name: "Accessories", icon: <Bell className="w-5 h-5" /> }
    ]
  },
  { 
    id: 20, 
    name: "Agriculture", 
    icon: <Wheat className="w-6 h-6" />, 
    color: COLORS.lime,
    subcategories: [
      { name: "Seeds & Pesticides", icon: <Leaf className="w-5 h-5" /> },
      { name: "Fertilizers", icon: <FlaskConical className="w-5 h-5" /> },
      { name: "Farm Machinery", icon: <Tractor className="w-5 h-5" /> },
      { name: "Nursery", icon: <Flower2 className="w-5 h-5" /> }
    ]
  },
  { 
    id: 21, 
    name: "Industry / Manufacture", 
    icon: <Factory className="w-6 h-6" />, 
    color: COLORS.slate,
    subcategories: [
      { name: "Raw Material", icon: <Box className="w-5 h-5" /> },
      { name: "Factory", icon: <Factory className="w-5 h-5" /> },
      { name: "Tools & Hardware", icon: <Wrench className="w-5 h-5" /> },
      { name: "Packaging", icon: <Package className="w-5 h-5" /> }
    ]
  },
  { 
    id: 22, 
    name: "Private Entities", 
    icon: <Building2 className="w-6 h-6" />, 
    color: COLORS.indigo,
    subcategories: [
      { name: "Corporate Office", icon: <Briefcase className="w-5 h-5" /> },
      { name: "Co-working Space", icon: <Building2 className="w-5 h-5" /> },
      { name: "NGO", icon: <Handshake className="w-5 h-5" /> },
      { name: "Private Limited", icon: <TrendingDown className="w-5 h-5" /> }
    ]
  },
  { 
    id: 23, 
    name: "Government Entities", 
    icon: <Landmark className="w-6 h-6" />, 
    color: COLORS.red,
    subcategories: [
      { name: "Municipal Office", icon: <Landmark className="w-5 h-5" /> },
      { name: "Police Station", icon: <ShieldCheck className="w-5 h-5" /> },
      { name: "Post Office", icon: <Mail className="w-5 h-5" /> },
      { name: "Court", icon: <Scale className="w-5 h-5" /> }
    ]
  },
  { 
    id: 24, 
    name: "Tours and Travels", 
    icon: <Plane className="w-6 h-6" />, 
    color: COLORS.sky,
    subcategories: [
      { name: "Travel Agency", icon: <Umbrella className="w-5 h-5" /> },
      { name: "Taxi Service", icon: <Car className="w-5 h-5" /> },
      { name: "Ticket Booking", icon: <Ticket className="w-5 h-5" /> },
      { name: "Visa Consultant", icon: <FileCheck className="w-5 h-5" /> }
    ]
  },
  { 
    id: 25, 
    name: "Hotel and Stays", 
    icon: <Building className="w-6 h-6" />, 
    color: COLORS.amber,
    subcategories: [
      { name: "Hotel", icon: <Building className="w-5 h-5" /> },
      { name: "Guest House", icon: <Home className="w-5 h-5" /> },
      { name: "Resort", icon: <TreePine className="w-5 h-5" /> },
      { name: "Dharamshala", icon: <Home className="w-5 h-5" /> }
    ]
  },
  { 
    id: 26, 
    name: "Marriage and Function", 
    icon: <Heart className="w-6 h-6" />, 
    color: COLORS.rose,
    subcategories: [
      { name: "Banquet Hall", icon: <Heart className="w-5 h-5" /> },
      { name: "Decorator", icon: <Gift className="w-5 h-5" /> },
      { name: "Photographer", icon: <Camera className="w-5 h-5" /> },
      { name: "Event Planner", icon: <Clipboard className="w-5 h-5" /> }
    ]
  },
  { 
    id: 27, 
    name: "Adviser and Agents", 
    icon: <Handshake className="w-6 h-6" />, 
    color: COLORS.purple,
    subcategories: [
      { name: "LIC Agent", icon: <File className="w-5 h-5" /> },
      { name: "RTO Agent", icon: <Car className="w-5 h-5" /> },
      { name: "Real Estate Agent", icon: <Home className="w-5 h-5" /> },
      { name: "Passport Agent", icon: <Plane className="w-5 h-5" /> }
    ]
  },
  { 
    id: 28, 
    name: "Printing and Media", 
    icon: <Printer className="w-6 h-6" />, 
    color: COLORS.teal,
    subcategories: [
      { name: "Xerox & Print", icon: <File className="w-5 h-5" /> },
      { name: "Printing Press", icon: <Newspaper className="w-5 h-5" /> },
      { name: "Graphic Design", icon: <Palette className="w-5 h-5" /> },
      { name: "Banner/Hoarding", icon: <ImageIcon className="w-5 h-5" /> }
    ]
  },
  { 
    id: 29, 
    name: "Other", 
    icon: <Tag className="w-6 h-6" />, 
    color: COLORS.slate,
    subcategories: [
      { name: "General Store", icon: <Store className="w-5 h-5" /> },
      { name: "Gift Shop", icon: <Gift className="w-5 h-5" /> },
      { name: "Pet Shop", icon: <Dog className="w-5 h-5" /> },
      { name: "Miscellaneous", icon: <HelpCircle className="w-5 h-5" /> }
    ]
  }
];