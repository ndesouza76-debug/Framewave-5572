import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

/** Autoplaying looped, muted video preview (tap for native controls). */
export function VideoPlayer({
  uri,
  style,
  autoPlay = true,
  muted = true,
  controls = false,
}: {
  uri: string;
  style?: object;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
}) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = muted;
  });

  useEffect(() => {
    if (autoPlay) player.play();
  }, [autoPlay, player]);

  return (
    <View style={[styles.wrap, style]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={controls}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden", backgroundColor: "#000" },
});
