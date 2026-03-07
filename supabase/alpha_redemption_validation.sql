create or replace function public.validate_alpha_redemption(
  p_user uuid,
  p_cart_total int,
  p_requested_discount int
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_balance int;
  v_max_discount int;
begin
  select coalesce(sum(amount), 0)::int
  into v_balance
  from public.alpha_sikka_transactions
  where user_id = p_user;

  if p_cart_total < 1000 then
    return false;
  end if;

  v_max_discount := floor(p_cart_total * 0.2);

  if p_requested_discount > v_balance then
    return false;
  end if;

  if p_requested_discount > v_max_discount then
    return false;
  end if;

  return true;
end;
$$;
