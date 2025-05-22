import { TabsContent } from "@/components/ui/tabs"

import {
  EffectList,
  FilterList,
  MediaList,
  MediaListProvider,
  MusicList,
  SubtitlesList,
  TemplateList,
  TransitionsList,
} from "./tabs"

export function BrowserContent() {
  const contentClassName = "bg-background m-0 flex-1 overflow-auto"

  return (
    <>
      <TabsContent value="media" className={contentClassName}>
        <MediaListProvider>
          <MediaList />
        </MediaListProvider>
      </TabsContent>
      <TabsContent value="music" className={contentClassName}>
        <MusicList />
      </TabsContent>
      <TabsContent value="transitions" className={contentClassName}>
        <TransitionsList />
      </TabsContent>
      <TabsContent value="effects" className={contentClassName}>
        <EffectList />
      </TabsContent>
      <TabsContent value="subtitles" className={contentClassName}>
        <SubtitlesList />
      </TabsContent>
      <TabsContent value="filters" className={contentClassName}>
        <FilterList />
      </TabsContent>
      <TabsContent value="templates" className={contentClassName}>
        <TemplateList />
      </TabsContent>
    </>
  )
}
