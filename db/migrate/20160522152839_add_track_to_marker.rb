class AddTrackToMarker < ActiveRecord::Migration
  def change
    add_reference :markers, :track, index: true, foreign_key: true
  end
end
