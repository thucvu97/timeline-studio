/**
 * Главный компонент управления персонами
 * Объединяет список персон, детальный просмотр и форму редактирования
 */

import { useEffect, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"

import { PersonDetail } from "./person-detail"
import { PersonForm } from "./person-form"
import { PersonList } from "./person-list"
import { PersonDatabaseService } from "../services/person-database-service"

import type { PersonAppearance, PersonProfile } from "../types/person"

interface PersonManagerProps {
  className?: string
}

export function PersonManager({ className }: PersonManagerProps) {
  const [persons, setPersons] = useState<PersonProfile[]>([])
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<PersonProfile | null>(null)
  const [editingPerson, setEditingPerson] = useState<PersonProfile | null>(null)
  const [appearances, setAppearances] = useState<PersonAppearance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const personDatabase = PersonDatabaseService.getInstance()

  // Загрузка всех персон при монтировании
  useEffect(() => {
    void loadPersons()
  }, [])

  // Загрузка данных о выбранной персоне
  useEffect(() => {
    if (selectedPersonId) {
      void loadPersonDetails(selectedPersonId)
    } else {
      setSelectedPerson(null)
      setAppearances([])
    }
  }, [selectedPersonId])

  const loadPersons = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const allPersons = await personDatabase.getAllPersons()
      setPersons(allPersons)
    } catch (err) {
      setError("Ошибка загрузки персон")
      console.error("Failed to load persons:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPersonDetails = async (personId: string) => {
    try {
      const person = persons.find((p) => p.id === personId)
      if (person) {
        setSelectedPerson(person)
        // Здесь можно загрузить дополнительные данные о появлениях персоны
        // const personAppearances = await loadPersonAppearances(personId)
        // setAppearances(personAppearances)
        setAppearances([]) // Пока заглушка
      }
    } catch (err) {
      setError("Ошибка загрузки данных персоны")
      console.error("Failed to load person details:", err)
    }
  }

  const handleSelectPerson = (personId: string) => {
    setSelectedPersonId(personId)
  }

  const handleCreatePerson = () => {
    setEditingPerson(null)
    setShowForm(true)
  }

  const handleEditPerson = (personId: string) => {
    const person = persons.find((p) => p.id === personId)
    if (person) {
      setEditingPerson(person)
      setShowForm(true)
    }
  }

  const handleDeletePerson = async (personId: string) => {
    if (confirm("Вы уверены, что хотите удалить эту персону?")) {
      try {
        await personDatabase.deletePerson(personId)
        await loadPersons()

        // Если удаляем выбранную персону, сбрасываем выбор
        if (selectedPersonId === personId) {
          setSelectedPersonId(null)
        }
      } catch (err) {
        setError("Ошибка удаления персоны")
        console.error("Failed to delete person:", err)
      }
    }
  }

  const handleSavePerson = async (personData: Partial<PersonProfile>) => {
    try {
      if (editingPerson) {
        // Обновление существующей персоны
        await personDatabase.updatePerson(editingPerson.id, personData)
      } else {
        // Создание новой персоны
        await personDatabase.addPerson({
          name: personData.name!,
          description: personData.description,
          tags: personData.tags,
          thumbnailPath: personData.thumbnailPath,
        })
      }

      await loadPersons()
      setShowForm(false)
      setEditingPerson(null)
    } catch (err) {
      setError("Ошибка сохранения персоны")
      console.error("Failed to save person:", err)
      throw err // Пробрасываем ошибку для обработки в форме
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingPerson(null)
  }

  const handleCloseDetail = () => {
    setSelectedPersonId(null)
  }

  const handleEditFromDetail = () => {
    if (selectedPerson) {
      handleEditPerson(selectedPerson.id)
    }
  }

  return (
    <div className={`flex h-full ${className}`}>
      {/* Список персон */}
      <div className="w-80 border-r bg-background">
        <PersonList
          persons={persons}
          selectedPersonId={selectedPersonId}
          onSelectPerson={handleSelectPerson}
          onEditPerson={handleEditPerson}
          onDeletePerson={handleDeletePerson}
          onCreatePerson={handleCreatePerson}
          isLoading={isLoading}
        />
      </div>

      {/* Детальный просмотр */}
      <div className="flex-1">
        {error && (
          <Alert className="m-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {selectedPerson ? (
          <PersonDetail
            person={selectedPerson}
            appearances={appearances}
            onEdit={handleEditFromDetail}
            onClose={handleCloseDetail}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">Выберите персону</h3>
              <p className="text-sm text-muted-foreground">
                Выберите персону из списка слева для просмотра подробной информации
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Форма создания/редактирования */}
      <PersonForm person={editingPerson} isOpen={showForm} onClose={handleCloseForm} onSave={handleSavePerson} />
    </div>
  )
}
