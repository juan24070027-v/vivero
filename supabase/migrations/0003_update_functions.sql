-- ============================================================================
-- 0003 — Actualiza las funciones RPC de 0001 para que conozcan fertilizantes
-- y clientes (agregados en 0002), y agrega la función para editar una
-- cotización pendiente. CREATE OR REPLACE conserva los permisos ya
-- otorgados en 0001, así que no hace falta repetir el revoke/grant salvo
-- para la función nueva.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RPC: aprobar cotización — ahora también descuenta stock de fertilizantes,
-- con el mismo bloqueo de fila que ya usaba semillas.
-- ----------------------------------------------------------------------------
create or replace function public.approve_quotation(p_quotation_id uuid, p_force boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quotation record;
  v_item record;
  v_seed record;
  v_fertilizer record;
  v_issues jsonb := '[]'::jsonb;
begin
  if not public.can_access() then
    raise exception 'No autorizado';
  end if;

  select * into v_quotation from public.quotations where id = p_quotation_id for update;
  if not found then
    raise exception 'Cotización no encontrada';
  end if;
  if v_quotation.status = 'aprobada' then
    return jsonb_build_object('success', true, 'already_approved', true);
  end if;

  if v_quotation.product_type = 'semillas' then
    for v_item in select * from public.quotation_items where quotation_id = p_quotation_id loop
      if v_item.seed_id is not null then
        select * into v_seed from public.seeds where id = v_item.seed_id for update;
        if v_seed is null then
          v_issues := v_issues || jsonb_build_object('item', v_item.common_name, 'issue', 'producto_no_encontrado');
        elsif v_seed.stock_kg < v_item.quantity then
          v_issues := v_issues || jsonb_build_object(
            'item', v_item.common_name, 'issue', 'stock_insuficiente',
            'disponible', v_seed.stock_kg, 'solicitado', v_item.quantity
          );
        end if;
      end if;
    end loop;

    if jsonb_array_length(v_issues) > 0 and not p_force then
      return jsonb_build_object('success', false, 'issues', v_issues);
    end if;

    update public.seeds s
    set stock_kg = greatest(0, s.stock_kg - qi.quantity)
    from public.quotation_items qi
    where qi.quotation_id = p_quotation_id and qi.seed_id = s.id;
  elsif v_quotation.product_type = 'fertilizantes' then
    for v_item in select * from public.quotation_items where quotation_id = p_quotation_id loop
      if v_item.fertilizer_id is not null then
        select * into v_fertilizer from public.fertilizers where id = v_item.fertilizer_id for update;
        if v_fertilizer is null then
          v_issues := v_issues || jsonb_build_object('item', v_item.common_name, 'issue', 'producto_no_encontrado');
        elsif v_fertilizer.stock < v_item.quantity then
          v_issues := v_issues || jsonb_build_object(
            'item', v_item.common_name, 'issue', 'stock_insuficiente',
            'disponible', v_fertilizer.stock, 'solicitado', v_item.quantity
          );
        end if;
      end if;
    end loop;

    if jsonb_array_length(v_issues) > 0 and not p_force then
      return jsonb_build_object('success', false, 'issues', v_issues);
    end if;

    update public.fertilizers f
    set stock = greatest(0, f.stock - qi.quantity)
    from public.quotation_items qi
    where qi.quotation_id = p_quotation_id and qi.fertilizer_id = f.id;
  end if;

  update public.quotations set status = 'aprobada', updated_at = now() where id = p_quotation_id;

  return jsonb_build_object('success', true);
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC: duplicar cotización — ahora copia también client_id, fertilizer_id y
-- unit_label.
-- ----------------------------------------------------------------------------
create or replace function public.duplicate_quotation(p_quotation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_id uuid := gen_random_uuid();
  v_old public.quotations%rowtype;
begin
  if not public.can_access() then
    raise exception 'No autorizado';
  end if;

  select * into v_old from public.quotations where id = p_quotation_id;
  if not found then
    raise exception 'Cotización no encontrada';
  end if;

  insert into public.quotations (
    id, product_type, client_id, client_name, client_address, quote_date, validity_days, quote_city, notes,
    conditions, tax_rate, discount_type, discount_value, shipping_cost, subtotal, discount_amount, tax_amount,
    total, status, created_by
  ) values (
    v_new_id, v_old.product_type, v_old.client_id, v_old.client_name, v_old.client_address, current_date,
    v_old.validity_days, v_old.quote_city, v_old.notes, v_old.conditions,
    v_old.tax_rate, v_old.discount_type, v_old.discount_value, v_old.shipping_cost,
    v_old.subtotal, v_old.discount_amount, v_old.tax_amount, v_old.total,
    'pendiente', auth.uid()
  );

  insert into public.quotation_items (
    quotation_id, seed_id, plant_id, fertilizer_id, common_name, scientific_name, classification,
    available_months, seeds_per_kilo, bag_size, height, unit_label, unit_price, quantity, subtotal, sort_order
  )
  select
    v_new_id, seed_id, plant_id, fertilizer_id, common_name, scientific_name, classification,
    available_months, seeds_per_kilo, bag_size, height, unit_label, unit_price, quantity, subtotal, sort_order
  from public.quotation_items where quotation_id = p_quotation_id;

  return v_new_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC: crear cotización + renglones — ahora acepta client_id opcional y
-- renglones de fertilizantes.
-- ----------------------------------------------------------------------------
create or replace function public.create_quotation_with_items(p_quotation jsonb, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.can_access() then
    raise exception 'No autorizado';
  end if;

  insert into public.quotations (
    product_type, client_id, client_name, client_address, quote_date, validity_days, quote_city, notes, conditions,
    tax_rate, discount_type, discount_value, shipping_cost, subtotal, discount_amount, tax_amount, total, created_by
  )
  values (
    (p_quotation->>'product_type')::quotation_product_type,
    nullif(p_quotation->>'client_id', '')::uuid,
    p_quotation->>'client_name',
    nullif(p_quotation->>'client_address', ''),
    coalesce((p_quotation->>'quote_date')::date, current_date),
    coalesce((p_quotation->>'validity_days')::int, 10),
    coalesce(p_quotation->>'quote_city', 'Mérida, Yucatán'),
    coalesce(p_quotation->>'notes', ''),
    coalesce(p_quotation->'conditions', '[]'::jsonb),
    coalesce((p_quotation->>'tax_rate')::numeric, 0),
    coalesce((p_quotation->>'discount_type')::discount_type, 'none'),
    coalesce((p_quotation->>'discount_value')::numeric, 0),
    coalesce((p_quotation->>'shipping_cost')::numeric, 0),
    (p_quotation->>'subtotal')::numeric,
    (p_quotation->>'discount_amount')::numeric,
    (p_quotation->>'tax_amount')::numeric,
    (p_quotation->>'total')::numeric,
    auth.uid()
  )
  returning id into v_id;

  insert into public.quotation_items (
    quotation_id, seed_id, plant_id, fertilizer_id, common_name, scientific_name, classification,
    available_months, seeds_per_kilo, bag_size, height, unit_label, unit_price, quantity, subtotal, sort_order
  )
  select
    v_id,
    nullif(item->>'seed_id', '')::uuid,
    nullif(item->>'plant_id', '')::uuid,
    nullif(item->>'fertilizer_id', '')::uuid,
    item->>'common_name',
    nullif(item->>'scientific_name', ''),
    nullif(item->>'classification', '')::seed_classification,
    nullif(item->>'available_months', ''),
    nullif(item->>'seeds_per_kilo', '')::integer,
    nullif(item->>'bag_size', '')::bag_size,
    nullif(item->>'height', '')::plant_height,
    nullif(item->>'unit_label', ''),
    (item->>'unit_price')::numeric,
    (item->>'quantity')::numeric,
    (item->>'subtotal')::numeric,
    (ord - 1)::integer
  from jsonb_array_elements(p_items) with ordinality as t(item, ord);

  return v_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC: editar una cotización pendiente (reemplaza sus renglones). Solo
-- funciona mientras status = 'pendiente', para no alterar el historial de
-- una cotización ya aprobada/rechazada/facturada.
-- ----------------------------------------------------------------------------
create function public.update_quotation_with_items(p_quotation_id uuid, p_quotation jsonb, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status quotation_status;
begin
  if not public.can_access() then
    raise exception 'No autorizado';
  end if;

  select status into v_status from public.quotations where id = p_quotation_id for update;
  if v_status is null then
    raise exception 'Cotización no encontrada';
  end if;
  if v_status <> 'pendiente' then
    raise exception 'Solo se pueden editar cotizaciones pendientes';
  end if;

  update public.quotations set
    client_id = nullif(p_quotation->>'client_id', '')::uuid,
    client_name = p_quotation->>'client_name',
    client_address = nullif(p_quotation->>'client_address', ''),
    quote_date = coalesce((p_quotation->>'quote_date')::date, quote_date),
    validity_days = coalesce((p_quotation->>'validity_days')::int, validity_days),
    quote_city = coalesce(p_quotation->>'quote_city', quote_city),
    notes = coalesce(p_quotation->>'notes', notes),
    conditions = coalesce(p_quotation->'conditions', conditions),
    tax_rate = coalesce((p_quotation->>'tax_rate')::numeric, tax_rate),
    discount_type = coalesce((p_quotation->>'discount_type')::discount_type, discount_type),
    discount_value = coalesce((p_quotation->>'discount_value')::numeric, discount_value),
    shipping_cost = coalesce((p_quotation->>'shipping_cost')::numeric, shipping_cost),
    subtotal = (p_quotation->>'subtotal')::numeric,
    discount_amount = (p_quotation->>'discount_amount')::numeric,
    tax_amount = (p_quotation->>'tax_amount')::numeric,
    total = (p_quotation->>'total')::numeric,
    updated_at = now()
  where id = p_quotation_id;

  delete from public.quotation_items where quotation_id = p_quotation_id;

  insert into public.quotation_items (
    quotation_id, seed_id, plant_id, fertilizer_id, common_name, scientific_name, classification,
    available_months, seeds_per_kilo, bag_size, height, unit_label, unit_price, quantity, subtotal, sort_order
  )
  select
    p_quotation_id,
    nullif(item->>'seed_id', '')::uuid,
    nullif(item->>'plant_id', '')::uuid,
    nullif(item->>'fertilizer_id', '')::uuid,
    item->>'common_name',
    nullif(item->>'scientific_name', ''),
    nullif(item->>'classification', '')::seed_classification,
    nullif(item->>'available_months', ''),
    nullif(item->>'seeds_per_kilo', '')::integer,
    nullif(item->>'bag_size', '')::bag_size,
    nullif(item->>'height', '')::plant_height,
    nullif(item->>'unit_label', ''),
    (item->>'unit_price')::numeric,
    (item->>'quantity')::numeric,
    (item->>'subtotal')::numeric,
    (ord - 1)::integer
  from jsonb_array_elements(p_items) with ordinality as t(item, ord);

  return p_quotation_id;
end;
$$;

revoke all on function public.update_quotation_with_items(uuid, jsonb, jsonb) from public;
grant execute on function public.update_quotation_with_items(uuid, jsonb, jsonb) to authenticated;

-- ----------------------------------------------------------------------------
-- RPC: restaurar respaldo — ahora también wipe+restore de fertilizantes y
-- clientes, y copia client_id/fertilizer_id/unit_label.
-- ----------------------------------------------------------------------------
create or replace function public.restore_backup(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Solo un superadmin puede restaurar un respaldo';
  end if;

  delete from public.quotation_items;
  delete from public.quotations;
  delete from public.seeds;
  delete from public.plants;
  delete from public.fertilizers;
  delete from public.clients;

  insert into public.clients (id, code, name, address, phone, email, notes, created_at, updated_at)
  select
    (r->>'id')::uuid, r->>'code', r->>'name', r->>'address', r->>'phone', r->>'email', r->>'notes',
    coalesce((r->>'created_at')::timestamptz, now()), coalesce((r->>'updated_at')::timestamptz, now())
  from jsonb_array_elements(coalesce(p_payload->'clients', '[]'::jsonb)) r;

  insert into public.seeds (
    id, code, common_name, scientific_name, classification, available_months,
    seeds_per_kilo, unit_price, stock_kg, created_at, updated_at
  )
  select
    (r->>'id')::uuid, r->>'code', r->>'common_name', r->>'scientific_name',
    (r->>'classification')::seed_classification, r->>'available_months',
    nullif(r->>'seeds_per_kilo', '')::integer, (r->>'unit_price')::numeric, (r->>'stock_kg')::numeric,
    coalesce((r->>'created_at')::timestamptz, now()), coalesce((r->>'updated_at')::timestamptz, now())
  from jsonb_array_elements(coalesce(p_payload->'seeds', '[]'::jsonb)) r;

  insert into public.plants (id, code, common_name, scientific_name, created_at, updated_at)
  select
    (r->>'id')::uuid, r->>'code', r->>'common_name', r->>'scientific_name',
    coalesce((r->>'created_at')::timestamptz, now()), coalesce((r->>'updated_at')::timestamptz, now())
  from jsonb_array_elements(coalesce(p_payload->'plants', '[]'::jsonb)) r;

  insert into public.fertilizers (id, code, common_name, unit_label, unit_price, stock, created_at, updated_at)
  select
    (r->>'id')::uuid, r->>'code', r->>'common_name', coalesce(r->>'unit_label', 'kg'),
    (r->>'unit_price')::numeric, (r->>'stock')::numeric,
    coalesce((r->>'created_at')::timestamptz, now()), coalesce((r->>'updated_at')::timestamptz, now())
  from jsonb_array_elements(coalesce(p_payload->'fertilizers', '[]'::jsonb)) r;

  insert into public.quotations (
    id, folio, product_type, client_id, client_name, client_address, quote_date, validity_days, quote_city, notes,
    conditions, tax_rate, discount_type, discount_value, shipping_cost, subtotal, discount_amount, tax_amount,
    total, status, created_by, created_at, updated_at
  )
  select
    (r->>'id')::uuid, r->>'folio', (r->>'product_type')::quotation_product_type, nullif(r->>'client_id', '')::uuid,
    r->>'client_name', r->>'client_address',
    (r->>'quote_date')::date, (r->>'validity_days')::integer, r->>'quote_city', r->>'notes',
    coalesce(r->'conditions', '[]'::jsonb), (r->>'tax_rate')::numeric, (r->>'discount_type')::discount_type,
    (r->>'discount_value')::numeric, (r->>'shipping_cost')::numeric, (r->>'subtotal')::numeric,
    (r->>'discount_amount')::numeric, (r->>'tax_amount')::numeric, (r->>'total')::numeric,
    (r->>'status')::quotation_status, nullif(r->>'created_by', '')::uuid,
    coalesce((r->>'created_at')::timestamptz, now()), coalesce((r->>'updated_at')::timestamptz, now())
  from jsonb_array_elements(coalesce(p_payload->'quotations', '[]'::jsonb)) r;

  insert into public.quotation_items (
    id, quotation_id, seed_id, plant_id, fertilizer_id, common_name, scientific_name, classification,
    available_months, seeds_per_kilo, bag_size, height, unit_label, unit_price, quantity, subtotal, sort_order
  )
  select
    (r->>'id')::uuid, (r->>'quotation_id')::uuid, nullif(r->>'seed_id', '')::uuid, nullif(r->>'plant_id', '')::uuid,
    nullif(r->>'fertilizer_id', '')::uuid,
    r->>'common_name', r->>'scientific_name', nullif(r->>'classification', '')::seed_classification,
    r->>'available_months', nullif(r->>'seeds_per_kilo', '')::integer, nullif(r->>'bag_size', '')::bag_size,
    nullif(r->>'height', '')::plant_height, nullif(r->>'unit_label', ''),
    (r->>'unit_price')::numeric, (r->>'quantity')::numeric,
    (r->>'subtotal')::numeric, coalesce((r->>'sort_order')::integer, 0)
  from jsonb_array_elements(coalesce(p_payload->'quotation_items', '[]'::jsonb)) r;

  perform setval('public.seed_code_seq', greatest(1, (select count(*) from public.seeds)));
  perform setval('public.plant_code_seq', greatest(1, (select count(*) from public.plants)));
  perform setval('public.fertilizer_code_seq', greatest(1, (select count(*) from public.fertilizers)));
  perform setval('public.client_code_seq', greatest(1, (select count(*) from public.clients)));
  perform setval('public.quotation_folio_seq', greatest(1, (select count(*) from public.quotations)));

  return jsonb_build_object('success', true);
end;
$$;
