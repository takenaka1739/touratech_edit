<?php

namespace App\Api\Calendar\Services;

use App\Base\Models\Calendar;
use App\Base\Models\CalendarRule;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CalendarService
{
    /**
     * 一覧取得（検索付き）
     *
     * @param array $cond
     * @return array
     */
    public function fetch(array $cond)
    {
        $query = Calendar::select(
            'id',
            'name',
            'start_at',
            'end_at',
            'back_color',
            'font_color'
        );

        $query = $this->setCondition($query, $cond);
        $query->orderBy('id', 'desc');
        $result = $query->paginate(config('const.paginate.per_page'))->toArray();

        return $result;
    }

    /**
     * 詳細取得
     *
     * @param int $id
     * @return array
     */
    public function get(int $id): array
    {
        $selectItems = Calendar::select(
          'm_calendars.id',
          'm_calendars.name',
          'm_calendars.start_at',
          'm_calendars.end_at',
          'm_calendars.font_color',
          'm_calendars.back_color',
          'm_calendars.is_monday',
          'm_calendars.is_tuesday',
          'm_calendars.is_wednesday',
          'm_calendars.is_thursday',
          'm_calendars.is_friday',
          'm_calendars.is_saturday',
          'm_calendars.is_sunday',
        )
        ->where('m_calendars.id', '=', $id)
        ->first()
        ->toArray();

        $selectItems['back_color'] = $selectItems['back_color'] === '#FFFFFF00' ? '#EDF2F7' : $selectItems['back_color'];
        $selectItems['trans_flag'] = $selectItems['back_color'] === '#FFFFFF00' ? true : false;
        return $selectItems;
    }

    ///**
    // * 登録
    // *
    // * @param array $data
    // */
    public function store(array $data): void
    {
        $backColor = $data['trans_flag'] === true ? '#FFFFFF00' : $data['back_color'];
        $data['back_color'] = $backColor;

        DB::transaction(function () use ($data) {
            Calendar::create($data);
        });
    }
//
    public function update(int $id, array $data): void
    {
        $data = new Collection($data);
        DB::transaction(function () use ($id, $data) {
          $m = Calendar::find($id);
          $backColor = $data->get('trans_flag') === true ? '#FFFFFF00' : $data->get('back_color');
          $m->name = $data->get('name');
          $m->start_at = $data->get('start_at');
          $m->end_at = $data->get('end_at');
          $m->font_color = $data->get('font_color');
          $m->back_color = $backColor;
          $m->is_monday = $data->get('is_monday');
          $m->is_tuesday = $data->get('is_tuesday');
          $m->is_wednesday = $data->get('is_wednesday');
          $m->is_thursday = $data->get('is_thursday');
          $m->is_friday = $data->get('is_friday');
          $m->is_saturday = $data->get('is_saturday');
          $m->is_sunday = $data->get('is_sunday');
          $m->save();
        });
    }
//
    ///**
    // * 削除
    // *
    // * @param int $id
    // */
    public function delete(int $id): void
    {
        DB::transaction(function () use ($id) {
          $m = Calendar::find($id);
          $m->forceDelete();
        });
    }

    /**
     * 検索条件設定
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param array $cond
     * @return \Illuminate\Database\Eloquent\Builder
     */
    private function setCondition($query, array $cond)
    {
        $cond = new Collection($cond);
        $c_keyword = $cond->get('c_keyword');
        if (!empty($c_keyword)) {
            $keywords = explode(' ', $c_keyword);
            foreach ($keywords as $key) {
                $query->where(function ($query) use ($key) {
                    $query->orWhere('name', 'like', '%' . escape_like($key) . '%');
                });
            }
        }

        return $query;
    }
}
