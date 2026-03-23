-- Prevent duplicate student records for the same teacher + name
alter table students
  add constraint students_teacher_name_unique unique (teacher_id, name);
