import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CurrencyProvider } from "@/hooks/useCurrency";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PractitionerAuth from "./pages/PractitionerAuth";
import Dashboard from "./pages/Dashboard";
import MeditationGuide from "./pages/MeditationGuide";
import Journal from "./pages/Journal";
import VideoSession from "./pages/VideoSession";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPractitioners from "./pages/AdminPractitioners";
import PractitionerDashboard from "./pages/PractitionerDashboard";
import Subscribe from "./pages/Subscribe";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SadhuBoard from "./pages/SadhuBoard";
import StepByStep from "./pages/StepByStep";
import Settings from "./pages/Settings";
import Contact from "./pages/Contact";
import UpdatePassword from "./pages/UpdatePassword";
import Pricing from "./pages/Pricing";
import SadhuBoardInfo from "./pages/SadhuBoardInfo";
import BecomePractitioner from "./pages/BecomePractitioner";
import SessionPayment from "./pages/SessionPayment";
import BookingConfirmation from "./pages/BookingConfirmation";
import PurchaseHistory from "./pages/PurchaseHistory";
import SessionDetail from "./pages/SessionDetail";
import PurchaseDetail from "./pages/PurchaseDetail";
import BookSession from "./pages/BookSession";
import JoinSession from "./pages/JoinSession";
import TestSession from "./pages/TestSession";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminUsers from "./pages/AdminUsers";
import AdminSubscriptions from "./pages/AdminSubscriptions";
import AdminSettings from "./pages/AdminSettings";
import AdminGroupSessions from "./pages/AdminGroupSessions";
import AdminVideos from "./pages/AdminVideos";
import Policies from "./pages/admin/Policies";
import NotFound from "./pages/NotFound";
import PractitionerSessionsPage from "./pages/practitioner/PractitionerSessionsPage";
import PractitionerClientsPage from "./pages/practitioner/PractitionerClientsPage";
import PractitionerAvailabilityPage from "./pages/practitioner/PractitionerAvailabilityPage";
import PractitionerEarningsPage from "./pages/practitioner/PractitionerEarningsPage";
import PractitionerActionsPage from "./pages/practitioner/PractitionerActionsPage";
import PractitionerContractPage from "./pages/practitioner/PractitionerContractPage";
import PractitionerSettingsPage from "./pages/practitioner/PractitionerSettingsPage";
import PractitionerSessionDetailPage from "./pages/practitioner/PractitionerSessionDetailPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/practitioner" element={<PractitionerAuth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/meditation" element={<MeditationGuide />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/sessions" element={<VideoSession />} />
            <Route path="/sessions/book" element={<BookSession />} />
            <Route path="/sessions/join" element={<JoinSession />} />
            <Route path="/sessions/test" element={<TestSession />} />
            <Route path="/sessions/payment" element={<SessionPayment />} />
            <Route path="/sessions/:sessionId" element={<SessionDetail />} />
            <Route path="/sessions/confirmation/:sessionId" element={<BookingConfirmation />} />
            <Route path="/purchases" element={<PurchaseHistory />} />
            <Route path="/purchases/:purchaseId" element={<PurchaseDetail />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/subscription-success" element={<SubscriptionSuccess />} />
            <Route path="/sadhu-board" element={<SadhuBoard />} />
            <Route path="/step-by-step" element={<StepByStep />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/sadhu-board-info" element={<SadhuBoardInfo />} />
            <Route path="/become-practitioner" element={<BecomePractitioner />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/practitioners" element={<AdminPractitioners />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/group-sessions" element={<AdminGroupSessions />} />
            <Route path="/admin/videos" element={<AdminVideos />} />
            <Route path="/admin/policies" element={<Policies />} />
            <Route path="/practitioner" element={<PractitionerDashboard />} />
            <Route path="/practitioner/sessions" element={<PractitionerSessionsPage />} />
            <Route path="/practitioner/sessions/:sessionId" element={<PractitionerSessionDetailPage />} />
            <Route path="/practitioner/clients" element={<PractitionerClientsPage />} />
            <Route path="/practitioner/availability" element={<PractitionerAvailabilityPage />} />
            <Route path="/practitioner/earnings" element={<PractitionerEarningsPage />} />
            <Route path="/practitioner/actions" element={<PractitionerActionsPage />} />
            <Route path="/practitioner/contract" element={<PractitionerContractPage />} />
            <Route path="/practitioner/settings" element={<PractitionerSettingsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
