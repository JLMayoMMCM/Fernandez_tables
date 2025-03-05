    SELECT w.worker_ID, CONCAT(p.first_Name, ' ', p.middle_Name, ' ', p.last_Name) AS worker_name
    FROM worker_tbl w
    JOIN staff_tbl s ON w.staff_ID = s.staff_id
    JOIN person_tbl p ON s.person_ID = p.person_id