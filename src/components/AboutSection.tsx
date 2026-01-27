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
                Our work began during a period of reassessment. For several years, my focus was almost exclusively on financial performance and materialistic life. It delivered results for a time, but at what cost? I had deprioritized nearly every other area of my life - relationships, long-term direction, emotional poise, and inner peace.
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
                    Imagine understanding the deepest depths of your emotions, all meanwhile training your nervous system to stay regulated. One realization was that my life never really felt like mine. My reality felt molded by external forces which my nervous system turned into unresolved internal battles. Suddenly I recognized the patterns, habits, and thoughts that needed an update in order to live life as myself. Since childhood I've felt a calling to make a tangible human impact—and what better way to do that than through the very thing that transformed both my physical and mental health. I'll never forget the morning I woke up feeling fully rested after months of insomnia. It's been a bitter sweet recognizing the disconnect and overwhelm in others. I hope you too will find stillness and calm through Sadhu.
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
