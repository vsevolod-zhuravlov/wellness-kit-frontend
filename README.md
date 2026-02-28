# Wellness Kit Frontend

This is the frontend application for **Wellness Kit**, a solution designed to solve the problem of **tax calculation for orders**.

## Live Demo
You can test the live deployed application here:
🔗 **[https://wellness-kit-frontend.vercel.app](https://wellness-kit-frontend.vercel.app)**

### Test Credentials
To log in and explore the application, use the following credentials:
- **Username / Email:** `admin` (or any string that looks like an email address, e.g., `test@example.com`)
- **Password:** `admin`

## Repository
🔗 **[https://github.com/vsevolod-zhuravlov/wellness-kit-frontend](https://github.com/vsevolod-zhuravlov/wellness-kit-frontend)**

## Purpose
The primary purpose of this application is to simplify and automate tax calculations for various orders. It provides an intuitive interface for managing orders, configuring tax settings, and ensuring compliance.

## Getting Started Locally

These instructions will guide you through getting a copy of the project up and running on your local machine for development and testing.

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (LTS version is recommended).

### Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vsevolod-zhuravlov/wellness-kit-frontend.git
   ```

2. **Navigate to the project directory:**
   ```bash
   cd wellness-kit-frontend
   ```

3. **Install the dependencies:**
   ```bash
   npm install
   ```
   *(Note: This project uses standard npm as its package manager).*

4. **Environment Configuration (Optional):**
   Create a `.env` file in the root directory to specify a custom backend URL if you are running the API locally:
   ```env
   VITE_BACKEND_URL=http://localhost:8080
   ```
   *If `.env` is omitted or `VITE_BACKEND_URL` is not set, the app will fall back to using default proxy configurations or the deployed remote backend.*

### Running the Development Server

To start the Vite development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173` to see the application in action.

### Building for Production

To create an optimized production build:

```bash
npm run build
```

This command will type-check the code using TypeScript (`tsc -b`) and bundle the project via Vite into the `dist` directory. You can preview the production build locally using `npm run preview`.

## App Structure & Pages

The application is built around a simple, intuitive flow centered around order management and tax calculation.

### 1. Login Page (`/login`)
The entry point for the application. It provides a secure login interface.
- Includes dummy credentials for demo purposes (`admin` / `admin`).
- Automatically redirects authenticated users to the Dashboard.

### 2. Dashboard (`/`)
The central hub of the application after logging in.
- **Top Metrics**: Displays high-level statistics like Total Revenue, Total Tax Collected, and Total Orders.
- **Order Tracking**: Contains a paginated data table showing all loaded orders.
- **Search & Filter**: Allows users to filter orders by ID, Date Range, and Amount locally.
- **Navigation**: Provides access to "Create Order" and "Import CSV" via the sidebar.

### 3. Create Order (`/create-order`)
A dedicated view for calculating tax on a new, single order based on location subtotal.
- **Interactive Map Location**: Users can drop a pin on the map or enter Latitude and Longitude coords manually. 
- **Validation**: Enforces that the location is strictly within New York State bounds.
- **Real-Time Tax Calculation**: Instantly computes New York State/Metro tax once a valid subtotal and location are provided.
- **Save to Database**: Completes the order workflow by sending it to the backend and generating an `ORD-XXXX` ID.

### 4. Import CSV (`/import-csv`)
A batch processing utility for importing bulk historical orders.
- **Drag & Drop**: Accepts `.csv` files natively.
- **CSV Data Validation**: Requires a schema of `latitude, longitude, subtotal` with optional identifiers.
- **Batch Geocoding**: Validates every row locally to ensure the coordinates fall within New York state before uploading to the backend.
- **Error Handling**: Generates visually distinct rows for valid/invalid entries and gives users the ability to automatically strip out invalid rows before final submission.

### 5. Order Detail (`/orders/:id`)
A granular view of an established order.
- **Order Headers**: Shows the Order ID, Timestamp, and processing Status.
- **Location Mapping**: Renders a static map block displaying the order's exact delivery coordinate.
- **Financial Breakdown**: Visually decomposes the Subtotal, precise Tax Rate, calculated Tax Amount, and Final Total.

## User Flows

Here are the primary journeys a user takes through the application:

1. **The Single Order Flow:**
   - User logs in and lands on the **Dashboard**.
   - User clicks *"New Order"* in the sidebar to open the **Create Order** page.
   - User drops a pin inside New York on the map and enters a subtotal (e.g. `$100`).
   - User clicks *"Calculate Tax"*, reviews the Tax Summary, and clicks *"Confirm & Save"*.
   - User is redirected to a Success screen, completing the flow.

2. **The Batch Processing Flow:**
   - User clicks *"Import CSV"* in the sidebar.
   - User downloads the sample template, fills it out, and drags the file into the upload zone.
   - The app parses the rows and verifies coordinates.
   - If a coordinate is outside NY, the user clicks *"Remove Invalid"*.
   - User clicks *"Upload"* to commit the valid orders in batch to the database.

3. **The Auditing Flow:**
   - User reviews the **Dashboard** table for a specific customer order.
   - User uses the *"Search Order ID"* or Date Filters to locate the record quickly.
   - User clicks the row, opening the **Order Detail** page to audit the precise geographical tax rate applied to that order.

## Technologies
- **React 19** Structure and UI components
- **TypeScript** Static typing
- **Vite** Fast frontend build tool
- **Tailwind CSS v4** Styling and design system
- **React Router** Client-side routing
- **React Query** Data fetching and caching
