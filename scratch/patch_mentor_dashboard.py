with open('components/mentor/MentorDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. En handleSelectHouse: filtrar a partir de 'students' de la BD en vez de ALL_48_STUDENTS si students ya está cargado
target1 = """        // Pre-cargar inmediatamente los 12 alumnos de la casa sin demora
        const houseRoster = ALL_48_STUDENTS.filter(s => s.house === houseKey).map(s => ({
            id: s.id,
            username: s.username,
            full_name: s.full_name,
            email: s.email,
            top_skill: s.top_skill,
            average_level: 4.7,
            completed_exams: []
        }))"""

repl1 = """        // Cargar los alumnos de la casa desde los estudiantes reales en BD
        const dbHouseStudents = students.filter(s => {
            const prof = getStudentHouseProfile(s.full_name || s.username || s.email || "")
            return prof?.house === houseKey
        })
        const houseRoster = dbHouseStudents.length > 0 ? dbHouseStudents : ALL_48_STUDENTS.filter(s => s.house === houseKey).map(s => ({
            id: s.id,
            username: s.username,
            full_name: s.full_name,
            email: s.email,
            top_skill: s.top_skill,
            average_level: 4.7,
            completed_exams: []
        }))"""

# 2. En PersonalizedTeamView students prop
target2 = """students={groupStudents.length > 0 ? groupStudents : (selectedHouse ? ALL_48_STUDENTS.filter(s => s.house === selectedHouse).map(s => ({"""
repl2 = """students={groupStudents.length > 0 ? groupStudents : (selectedHouse ? (students.filter(s => {
                                const prof = getStudentHouseProfile(s.full_name || s.username || s.email || "")
                                return prof?.house === selectedHouse
                            }).length > 0 ? students.filter(s => {
                                const prof = getStudentHouseProfile(s.full_name || s.username || s.email || "")
                                return prof?.house === selectedHouse
                            }) : ALL_48_STUDENTS.filter(s => s.house === selectedHouse).map(s => ({"""

if target1 in content:
    content = content.replace(target1, repl1, 1)
    print("Repl 1 OK")
else:
    print("Target 1 not found")

if target2 in content:
    # We must close the extra parenthesis properly
    old_block = """                            students={groupStudents.length > 0 ? groupStudents : (selectedHouse ? ALL_48_STUDENTS.filter(s => s.house === selectedHouse).map(s => ({
                                id: s.id,
                                username: s.username,
                                full_name: s.full_name,
                                email: s.email,
                                top_skill: s.top_skill,
                                average_level: 4.7,
                                completed_exams: []
                            })) : [])}"""
    
    new_block = """                            students={groupStudents.length > 0 ? groupStudents : (selectedHouse ? (() => {
                                const dbMatches = students.filter(s => {
                                    const prof = getStudentHouseProfile(s.full_name || s.username || s.email || "")
                                    return prof?.house === selectedHouse
                                })
                                return dbMatches.length > 0 ? dbMatches : ALL_48_STUDENTS.filter(s => s.house === selectedHouse).map(s => ({
                                    id: s.id,
                                    username: s.username,
                                    full_name: s.full_name,
                                    email: s.email,
                                    top_skill: s.top_skill,
                                    average_level: 4.7,
                                    completed_exams: []
                                }))
                            })() : [])}"""
    content = content.replace(old_block, new_block, 1)
    print("Repl 2 OK")
else:
    print("Target 2 not found")

with open('components/mentor/MentorDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated MentorDashboard.tsx")

