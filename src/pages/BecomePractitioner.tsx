import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Heart, Users, Award } from "lucide-react";

const applicationSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number").max(20),
  city: z.string().min(2, "City is required").max(100),
  country: z.string().min(2, "Country is required").max(100),
  yearsExperience: z.string().min(1, "Please select your experience level"),
  specializations: z.array(z.string()).min(1, "Please select at least one specialization"),
  certifications: z.string().max(1000).optional(),
  currentPractice: z.string().min(50, "Please provide more detail about your current practice").max(2000),
  personalStory: z.string().min(100, "Please share more about yourself (at least 100 characters)").max(3000),
  whyJoin: z.string().min(50, "Please tell us why you want to join Sadhu").max(1500),
  availability: z.string().min(1, "Please select your availability"),
  agreeTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const specializations = [
  { id: "meditation", label: "Meditation & Mindfulness" },
  { id: "breathwork", label: "Breathwork" },
  { id: "yoga", label: "Yoga" },
  { id: "sound-healing", label: "Sound Healing" },
  { id: "energy-work", label: "Energy Work & Reiki" },
  { id: "trauma", label: "Trauma-Informed Practice" },
  { id: "stress-management", label: "Stress Management" },
  { id: "pain-management", label: "Pain Management" },
  { id: "spiritual-coaching", label: "Spiritual Coaching" },
  { id: "holistic-wellness", label: "Holistic Wellness" },
];

const BecomePractitioner = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "",
      country: "",
      yearsExperience: "",
      specializations: [],
      certifications: "",
      currentPractice: "",
      personalStory: "",
      whyJoin: "",
      availability: "",
      agreeTerms: false,
    },
  });

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    try {
      // For now, we'll store applications - this can be enhanced later
      // to send emails or store in a dedicated applications table
      console.log("Practitioner application submitted:", data);
      
      toast.success("Application submitted successfully! We'll review your application and get back to you within 5-7 business days.");
      form.reset();
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-6 text-center">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
            Become a Sadhu Practitioner
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
            Join our community of dedicated practitioners helping others transform pain into peace 
            through guided sessions and personalized support.
          </p>
          
          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="flex flex-col items-center p-6 bg-card rounded-xl border border-border">
              <Sparkles className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-heading text-lg text-foreground mb-2">Flexible Schedule</h3>
              <p className="text-sm text-muted-foreground">Set your own hours and work from anywhere</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-card rounded-xl border border-border">
              <Heart className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-heading text-lg text-foreground mb-2">Meaningful Work</h3>
              <p className="text-sm text-muted-foreground">Help clients on their healing journey</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-card rounded-xl border border-border">
              <Users className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-heading text-lg text-foreground mb-2">Growing Community</h3>
              <p className="text-sm text-muted-foreground">Connect with like-minded practitioners</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-card rounded-xl border border-border">
              <Award className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-heading text-lg text-foreground mb-2">Competitive Earnings</h3>
              <p className="text-sm text-muted-foreground">Earn 75% of each session you conduct</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <Card className="border-border">
            <CardHeader className="text-center">
              <CardTitle className="font-heading text-2xl">Practitioner Application</CardTitle>
              <CardDescription>
                Tell us about yourself and your practice. All fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="font-heading text-lg text-foreground border-b border-border pb-2">
                      Personal Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your city" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your country" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Professional Experience */}
                  <div className="space-y-4">
                    <h3 className="font-heading text-lg text-foreground border-b border-border pb-2">
                      Professional Experience
                    </h3>

                    <FormField
                      control={form.control}
                      name="yearsExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your experience level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0-1">Less than 1 year</SelectItem>
                              <SelectItem value="1-3">1-3 years</SelectItem>
                              <SelectItem value="3-5">3-5 years</SelectItem>
                              <SelectItem value="5-10">5-10 years</SelectItem>
                              <SelectItem value="10+">10+ years</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specializations"
                      render={() => (
                        <FormItem>
                          <FormLabel>Specializations *</FormLabel>
                          <FormDescription>
                            Select all areas that apply to your practice
                          </FormDescription>
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            {specializations.map((item) => (
                              <FormField
                                key={item.id}
                                control={form.control}
                                name="specializations"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, item.id])
                                            : field.onChange(field.value?.filter((value) => value !== item.id));
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {item.label}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="certifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certifications & Training</FormLabel>
                          <FormDescription>
                            List any relevant certifications, training programs, or credentials
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              placeholder="E.g., RYT-200 Yoga Certification, Mindfulness-Based Stress Reduction (MBSR), Reiki Level 2..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentPractice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Practice *</FormLabel>
                          <FormDescription>
                            Describe your current practice, the types of clients you work with, and your approach
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about how you currently work with clients, your methodology, and what makes your approach unique..."
                              className="min-h-[150px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Personal Story */}
                  <div className="space-y-4">
                    <h3 className="font-heading text-lg text-foreground border-b border-border pb-2">
                      Your Story
                    </h3>

                    <FormField
                      control={form.control}
                      name="personalStory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Personal Journey *</FormLabel>
                          <FormDescription>
                            Share your personal story - what drew you to this path, your own healing journey, 
                            and the experiences that shaped who you are as a practitioner
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              placeholder="We'd love to hear about your journey. What experiences led you to become a practitioner? Have you had your own transformative experiences with practices like meditation, breathwork, or working with pain? What drives your passion for helping others?"
                              className="min-h-[200px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="whyJoin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Why Sadhu? *</FormLabel>
                          <FormDescription>
                            Tell us why you want to join the Sadhu practitioner community
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              placeholder="What resonates with you about Sadhu's mission? How do you see yourself contributing to our community of practitioners?"
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Availability */}
                  <div className="space-y-4">
                    <h3 className="font-heading text-lg text-foreground border-b border-border pb-2">
                      Availability
                    </h3>

                    <FormField
                      control={form.control}
                      name="availability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Weekly Availability *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="How many hours per week can you dedicate?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="5-10">5-10 hours/week</SelectItem>
                              <SelectItem value="10-20">10-20 hours/week</SelectItem>
                              <SelectItem value="20-30">20-30 hours/week</SelectItem>
                              <SelectItem value="30+">30+ hours/week (full-time)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Terms */}
                  <FormField
                    control={form.control}
                    name="agreeTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">
                            I agree to the terms and conditions *
                          </FormLabel>
                          <FormDescription>
                            By submitting this application, I confirm that all information provided is accurate 
                            and I agree to Sadhu's practitioner terms of service and privacy policy.
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting Application..." : "Submit Application"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BecomePractitioner;
