<?php

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

/**
 * Sign-in tokens. Sanctum writes "last used" to the database on every
 * request, which costs a disk write each time (up to ~100 ms on a slow
 * disk). Here it is saved at most once a minute; nothing in Siknayan
 * needs it more precisely (tokens expire by their creation time).
 */
class PersonalAccessToken extends SanctumPersonalAccessToken
{
    private const LAST_USED_EVERY_SECONDS = 60;

    public function save(array $options = [])
    {
        $dirty = array_keys($this->getDirty());
        $onlyLastUsed = $this->exists
            && $dirty !== []
            && array_diff($dirty, ['last_used_at', 'updated_at']) === [];

        if ($onlyLastUsed) {
            $previous = $this->getOriginal('last_used_at');

            if ($previous && now()->diffInSeconds($previous, true) < self::LAST_USED_EVERY_SECONDS) {
                // Recently saved: skip this write.
                $this->syncOriginal();

                return true;
            }
        }

        return parent::save($options);
    }
}
