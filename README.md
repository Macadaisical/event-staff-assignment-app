# Event Staff Assignment Application

A comprehensive web application for managing event staffing assignments, built with Next.js 15 and TypeScript.

## 🚀 Features

- **Event Management**: Create, edit, view, and manage events with all required details
- **Team Member Management**: Full CRUD operations with active/inactive status
- **Team Assignments**: Dynamic assignment creation with validation and time management
- **Traffic Control**: Specialized interface for traffic control assignments
- **PDF Export**: Professional document generation with comprehensive event details
- **Mobile Responsive**: Touch-friendly interface with hamburger navigation
- **Data Persistence**: Local storage with Zustand state management
- **Dark Mode Support**: Professional UI with light and dark themes

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand with persistence
- **PDF Generation**: jsPDF
- **Icons**: Lucide React
- **Build Tool**: Turbopack

## 📋 Requirements Fulfilled

All functional requirements (FR-1.x through FR-7.x) are implemented:

- ✅ **FR-1**: Complete event creation and management
- ✅ **FR-2**: Supervisor assignment functionality
- ✅ **FR-3**: Team member assignment system
- ✅ **FR-4**: Traffic control management
- ✅ **FR-5**: Data validation and error handling
- ✅ **FR-6**: PDF export and sharing capabilities
- ✅ **FR-7**: Mobile-responsive design

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd event-staff-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser.

## 📱 Usage

### Creating Events

1. Navigate to **Events** > **Create New Event**
2. Fill in all required event details
3. Add supervisors for the event
4. Save the event

### Managing Team Assignments

1. Go to the event detail page
2. Click **Manage Assignments**
3. Add team member assignments with:
   - Assignment type and equipment/area
   - Start and end times
   - Optional notes
4. Save assignments

### Managing Traffic Control

1. From the event detail page, click **Manage Traffic Control**
2. Assign staff members to traffic control with:
   - Patrol vehicle information
   - Area coverage details
3. Save traffic control assignments

### Exporting Documents

- Click **Export PDF** on any event detail page
- Professional PDF includes all event details, assignments, and traffic control information

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── events/            # Event management pages
│   ├── team-members/      # Team member management
│   └── settings/          # Application settings
├── components/            # Reusable React components
│   ├── layout/           # Header and navigation
│   └── ui/               # Form components and UI elements
├── stores/               # Zustand state management
├── types/                # TypeScript type definitions
└── utils/                # Utility functions and helpers
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Key Features

- **Responsive Design**: Mobile-first approach with touch-friendly interfaces
- **Data Validation**: Comprehensive client-side validation
- **Error Handling**: User-friendly error messages and recovery
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Performance**: Optimized with Next.js 15 and Turbopack

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using Next.js and modern web technologies.
