import test from "node:test";
import assert from "node:assert/strict";
import { authenticateDemoUser, createDemoDatabase, DEMO_QUICK_ACCESS } from "../../src/demo/demoFixtures.js";

test("quick access credentials match the seeded teacher and student", () => {
  const database = createDemoDatabase();
  for (const role of ["professor", "aluno"]) {
    const account = DEMO_QUICK_ACCESS[role];
    const user = authenticateDemoUser(database, account.email, account.password);
    assert.equal(user?.tipo, role);
    assert.equal(Object.hasOwn(user, "senha"), false);
  }
});

test("demo login is case-insensitive and rejects an incorrect password", () => {
  const database = createDemoDatabase();
  const account = DEMO_QUICK_ACCESS.aluno;
  assert.equal(authenticateDemoUser(database, account.email.toUpperCase(), account.password)?.id, "demo-aluno-1");
  assert.equal(authenticateDemoUser(database, account.email, "wrong-password"), null);
});

test("all demo classes, enrollments, activities, grades, weeks and checkmarks reference existing records", () => {
  const database = createDemoDatabase();
  const profiles = new Map(database.perfis.map(profile => [profile.id, profile]));
  const classes = new Map(database.turmas.map(turma => [turma.id, turma]));
  const activities = new Map(database.atividades.map(activity => [activity.id, activity]));
  const weeksByClass = new Map(database.semanas_turma.map(item => [item.classId, item.semanas]));

  assert.equal(database.turmas.every(turma => profiles.get(turma.professor_id)?.tipo === "professor"), true);
  for (const profile of database.perfis.filter(item => item.tipo === "aluno")) {
    const enrollments = profile.turma_ids || [profile.turma_id];
    assert.ok(enrollments.length > 0);
    assert.ok(enrollments.every(classId => classes.has(classId)));
    assert.ok(enrollments.includes(profile.turma_id));
  }
  assert.equal(database.atividades.every(activity => classes.has(activity.turma_id)), true);
  assert.equal(database.notas.every(grade => {
    const student = profiles.get(grade.aluno_id);
    const activity = activities.get(grade.atividade_id);
    return student?.tipo === "aluno" && activity && (student.turma_ids || [student.turma_id]).includes(activity.turma_id);
  }), true);
  assert.equal(database.semanas_turma.every(item => classes.has(item.classId)), true);
  assert.equal(database.vistos_semanais.every(mark =>
    profiles.get(mark.aluno_id)?.tipo === "aluno" &&
    classes.has(mark.class_id) &&
    weeksByClass.get(mark.class_id)?.includes(mark.semana)
  ), true);
});
