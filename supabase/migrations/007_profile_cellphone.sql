-- Add cellphone field to profiles for Abacate.pay billing
alter table profiles add column if not exists cellphone text;
