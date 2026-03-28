import { Navbar } from "@/components/Navbar";
import { videos } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Play, Share2, Clock, Eye } from "lucide-react";

const VideoCard = ({ video, featured }: { video: typeof videos[0]; featured?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`glass-card-hover overflow-hidden ${featured ? "" : ""}`}
  >
    <div className={`relative ${featured ? "h-64 md:h-80" : "h-40"} bg-gradient-to-br from-primary/20 via-secondary to-card flex items-center justify-center`}>
      <button className="w-12 h-12 rounded-full bg-primary/80 backdrop-blur flex items-center justify-center hover:bg-primary transition-colors">
        <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
      </button>
      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-background/80 text-[10px] font-mono font-medium">{video.duration}</span>
    </div>
    <div className="p-4">
      <h3 className={`font-semibold mb-2 ${featured ? "text-lg" : "text-sm"} leading-snug`}>{video.title}</h3>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{video.timeAgo}</span>
        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{video.views} views</span>
        <button className="ml-auto flex items-center gap-1 hover:text-foreground transition-colors"><Share2 className="h-3 w-3" />Share</button>
      </div>
    </div>
  </motion.div>
);

const VideosPage = () => {
  const featured = videos[0];
  const rest = videos.slice(1);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Daily Market Wrap</h1>
          <p className="text-sm text-muted-foreground mb-6">Auto-generated AI videos from live market data. No human editing.</p>
        </motion.div>

        <div className="mb-6">
          <VideoCard video={featured} featured />
          <p className="text-xs text-muted-foreground mt-2">Generated 4 mins after market close</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rest.map((v, i) => (
            <motion.div key={v.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <VideoCard video={v} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideosPage;
