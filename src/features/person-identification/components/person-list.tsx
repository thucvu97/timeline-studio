/**
 * Компонент списка персон
 * Отображает список всех персон с возможностью поиска и фильтрации
 */

import { useState } from "react"

import { Edit, Search, Trash2, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { PersonProfile } from "../types/person"

interface PersonListProps {
  persons: PersonProfile[]
  selectedPersonId?: string
  onSelectPerson: (personId: string) => void
  onEditPerson: (personId: string) => void
  onDeletePerson: (personId: string) => void
  onCreatePerson: () => void
  isLoading?: boolean
}

export function PersonList({
  persons,
  selectedPersonId,
  onSelectPerson,
  onEditPerson,
  onDeletePerson,
  onCreatePerson,
  isLoading = false,
}: PersonListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTag, setFilterTag] = useState<string | null>(null)

  // Фильтрация персон по поисковому запросу и тегам
  const filteredPersons = persons.filter((person) => {
    const matchesSearch =
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTag = !filterTag || person.tags?.includes(filterTag)

    return matchesSearch && matchesTag
  })

  // Получаем все уникальные теги
  const allTags = Array.from(new Set(persons.flatMap((p) => p.tags || [])))

  return (
    <div className="flex h-full flex-col space-y-4 p-4">
      {/* Заголовок и кнопка создания */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Персоны</h2>
        <Button onClick={onCreatePerson} size="sm">
          <User className="h-4 w-4 mr-2" />
          Добавить
        </Button>
      </div>

      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Поиск персон..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Фильтры по тегам */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button variant={filterTag === null ? "default" : "outline"} size="sm" onClick={() => setFilterTag(null)}>
            Все
          </Button>
          {allTags.map((tag) => (
            <Button
              key={tag}
              variant={filterTag === tag ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterTag(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
      )}

      {/* Список персон */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Загрузка...</div>
          </div>
        ) : filteredPersons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery || filterTag ? "Персоны не найдены" : "Пока нет добавленных персон"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPersons.map((person) => (
              <div
                key={person.id}
                className={`
                  group flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors
                  ${selectedPersonId === person.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}
                `}
                onClick={() => onSelectPerson(person.id)}
              >
                {/* Аватар */}
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  {person.thumbnails && person.thumbnails.length > 0 && person.thumbnails[0].imageUrl ? (
                    <img src={person.thumbnails[0].imageUrl} alt={person.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* Информация о персоне */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{person.name}</p>
                  {person.description && <p className="text-xs text-muted-foreground truncate">{person.description}</p>}

                  {/* Теги */}
                  {person.tags && person.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {person.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {person.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{person.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Статистика */}
                <div className="text-xs text-muted-foreground text-right">
                  <div>{person.detectedFaces?.length || 0} лиц</div>
                  <div>{person.appearanceCount || 0} появлений</div>
                </div>

                {/* Действия */}
                <div className="opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditPerson(person.id)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeletePerson(person.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
