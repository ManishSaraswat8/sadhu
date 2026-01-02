import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const AboutSection = () => {
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);

  return (
    <section id="about" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary font-medium tracking-widest uppercase text-sm">
            About Us
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-light mt-4 text-foreground">
            Our Mission
          </h2>
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          {/* Video Placeholder - Large Rectangle */}
          <div className="aspect-[21/9] bg-muted/30 rounded-2xl border border-border/50 flex items-center justify-center overflow-hidden">
            <div className="text-center p-8">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <svg 
                  className="w-10 h-10 text-primary" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-muted-foreground text-lg">Promotional Video</p>
            </div>
          </div>

          {/* Text Content - Centered */}
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto">
            Discover bespoke grounding sessions that quiet the noise, restore emotional poise, and rebuild your nervous system from the inside out.
          </p>
        </div>

        {/* Our Story Section */}
        <div className="max-w-4xl mx-auto mt-20">
          <div className="text-center mb-8">
            <h3 className="text-3xl md:text-4xl font-heading font-light text-foreground">
              Our Story
            </h3>
          </div>

          <div className="bg-muted/20 rounded-2xl border border-border/30 p-8 md:p-12">
            <div className={`prose prose-lg max-w-none text-muted-foreground leading-relaxed space-y-4 ${!isStoryExpanded ? 'line-clamp-6' : ''}`}>
              <p>
                Our work began during a period of reassessment. For several years, my focus was almost exclusively on financial performance through futures trading. That focus delivered results for a time, but it also came at a cost. When that chapter ended, it became clear that I had deprioritized important areas of life - relationships, emotional awareness, and long-term direction.
              </p>
              
              <p>
                During this period, I also began experiencing persistent anxiety and frequent migraines. The symptoms were disruptive and difficult to ignore. What stood out was not just their intensity, but how closely they tracked with prolonged stress, overexertion, and a lack of regulation.
              </p>

              {isStoryExpanded && (
                <>
                  <p>
                    Concurrently, the decline of my love life highlighted the consequences of self-neglect. Adrift both personally and professionally, my health deteriorated. Sleepless nights became routine, dominated by a constant sense of defeat. It was in that fragile space that I met Olga - a person who became one of the most meaningful connections in my life. She introduced me to the Sadhu board practice. At first, the idea of willingly standing on nails felt absurd. But her guidance completely changed my life.
                  </p>

                  <p>
                    Emotions I had buried surfaced. Old beliefs about my worth unraveled. It was painful - but it was also the first honest confrontation I'd had with myself in years. In that discomfort, I felt something rare: clarity. And with clarity came movement. I started taking real action toward the life I actually wanted - not the one I was performing for the world. Both my mental and physical health improved. After months of insomnia, full night of sleep felt like a return to life. I'll never forget the feeling.
                  </p>

                  <p className="border-l-4 border-primary pl-6 py-2 italic bg-primary/5 rounded-r-lg">
                    What I learned is simple: You will never change your circumstances if you avoid facing yourself. And the pain of staying the same is far greater than the temporary discomfort of the nail board.
                  </p>

                  <p>
                    As I continued researching, practicing, and studying this ancient method, I realized how many people must be silently struggling the way I was - disconnected, overwhelmed, and unsure where to turn. The Sadhu board didn't just transform my inner world; it rebuilt my confidence, my discipline, my emotional resilience, and the way I show up in every relationship.
                  </p>

                  <p className="font-medium text-foreground">
                    I knew then that this wasn't something to keep to myself.
                  </p>

                  <p className="text-center text-xl md:text-2xl font-heading italic text-foreground mt-8 leading-relaxed">
                    This is more than a tool.<br />
                    <span className="block mt-2">It's the beginning of a new chapter - one built on truth, courage, and the belief that healing is not only possible... it's within reach for everyone.</span>
                  </p>
                </>
              )}
            </div>

            <button
              onClick={() => setIsStoryExpanded(!isStoryExpanded)}
              className="flex items-center gap-2 mx-auto mt-6 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              {isStoryExpanded ? (
                <>
                  <span>Read Less</span>
                  <ChevronUp className="w-5 h-5" />
                </>
              ) : (
                <>
                  <span>Read Full Story</span>
                  <ChevronDown className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
