import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Play, ExternalLink } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface Video {
  title: string;
  url: string;
  duration?: string;
  channel?: string;
}

interface VideoPlayerProps {
  videos: Video[];
  title?: string;
}

// Extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const VideoPlayer = ({ videos, title = "Vídeos Recomendados" }: VideoPlayerProps) => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!videos || videos.length === 0) return null;

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setIsPlaying(true);
  };

  const selectedVideoId = selectedVideo ? getYouTubeVideoId(selectedVideo.url) : null;

  return (
    <div className="space-y-4 my-6">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
        <Play className="w-5 h-5 text-primary" />
        {title}
      </h3>

      {/* Main Player */}
      {isPlaying && selectedVideo && selectedVideoId && (
        <Card className="overflow-hidden bg-card border-border">
          <AspectRatio ratio={16 / 9}>
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1&rel=0`}
              title={selectedVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </AspectRatio>
          <CardContent className="py-3">
            <h4 className="font-medium text-foreground">{selectedVideo.title}</h4>
            {selectedVideo.channel && (
              <p className="text-sm text-muted-foreground">{selectedVideo.channel}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Video List */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video, index) => {
          const videoId = getYouTubeVideoId(video.url);
          const isSelected = selectedVideo?.url === video.url;
          
          return (
            <Card
              key={index}
              className={`cursor-pointer transition-all hover:border-primary/50 overflow-hidden ${
                isSelected ? 'ring-2 ring-primary border-primary' : 'border-border'
              }`}
              onClick={() => handleVideoClick(video)}
            >
              {videoId && (
                <div className="relative">
                  <AspectRatio ratio={16 / 9}>
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                  {video.duration && (
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                      {video.duration}
                    </span>
                  )}
                </div>
              )}
              <CardContent className="py-3">
                <h4 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
                  {video.title}
                </h4>
                {video.channel && (
                  <p className="text-xs text-muted-foreground mt-1">{video.channel}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* External Links */}
      {videos.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {videos.map((video, index) => (
            <a
              key={index}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Abrir no YouTube
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
